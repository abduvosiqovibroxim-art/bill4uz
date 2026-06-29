import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import {
  OrderStatus,
  PaymentMethod,
  Prisma,
  ShiftStatus,
  TableSessionStatus,
  TransactionType
} from "@prisma/client";
import { PrismaService } from "../common/prisma.service";
import { RequestUser } from "../auth/dto";
import { calculateSessionPrice, resolveOptionalClubPricingConfig } from "../bookings/pricing";
import { assertClubAccess } from "./access";
import { AddOrderItemDto, CloseSessionDto, StartSessionDto } from "./dto";

const ACTIVE_SESSION_STATUSES: TableSessionStatus[] = [TableSessionStatus.ACTIVE, TableSessionStatus.PAUSED];
const OPEN_ORDER_STATUSES: OrderStatus[] = [
  OrderStatus.PENDING,
  OrderStatus.CONFIRMED,
  OrderStatus.PREPARING,
  OrderStatus.READY,
  OrderStatus.DELIVERED
];

const clubPricingSelect = {
  regularMorningPriceMinor: true,
  regularEveningPriceMinor: true,
  vipMorningPriceMinor: true,
  vipEveningPriceMinor: true
} as const;

@Injectable()
export class SessionsService {
  constructor(private readonly prisma: PrismaService) {}

  /** Live grid: every active table session with elapsed time, time price and bar total. */
  async listActive(clubId: string, actor: RequestUser) {
    await assertClubAccess(this.prisma, clubId, actor);

    const club = await this.prisma.club.findUnique({ where: { id: clubId }, select: clubPricingSelect });
    const pricing = club ? resolveOptionalClubPricingConfig(club) : null;

    const sessions = await this.prisma.tableSession.findMany({
      where: { clubId, status: { in: ACTIVE_SESSION_STATUSES } },
      include: { table: { select: { id: true, name: true, kind: true } } },
      orderBy: { startedAt: "asc" }
    });

    const tableIds = sessions.map((session) => session.tableId);
    const orders = tableIds.length
      ? await this.prisma.menuOrder.findMany({
          where: { clubId, tableId: { in: tableIds }, status: { in: OPEN_ORDER_STATUSES } },
          include: { items: { include: { menuItem: { select: { name: true } } } } }
        })
      : [];
    const orderByTable = new Map(orders.map((order) => [order.tableId, order]));

    const now = new Date();
    return sessions.map((session) => {
      const order = orderByTable.get(session.tableId) ?? null;
      const quote = pricing ? calculateSessionPrice(session.table.kind, session.startedAt, now, pricing) : null;
      const timePriceMinor = quote?.priceMinor ?? 0;
      const barTotalMinor = order?.totalMinor ?? 0;

      return {
        id: session.id,
        status: session.status,
        startedAt: session.startedAt,
        customerName: session.customerName,
        elapsedMinutes: Math.max(0, Math.round((now.getTime() - session.startedAt.getTime()) / 60_000)),
        timePriceMinor,
        barTotalMinor,
        totalMinor: timePriceMinor + barTotalMinor,
        pricingConfigured: Boolean(pricing),
        table: session.table,
        order: order
          ? {
              id: order.id,
              orderNumber: order.orderNumber,
              totalMinor: order.totalMinor,
              items: order.items.map((item) => ({
                id: item.id,
                name: item.menuItem.name,
                quantity: item.quantity,
                priceMinor: item.priceMinor,
                lineTotalMinor: item.priceMinor * item.quantity
              }))
            }
          : null
      };
    });
  }

  async startSession(clubId: string, tableId: string, dto: StartSessionDto, actor: RequestUser) {
    await assertClubAccess(this.prisma, clubId, actor);

    const table = await this.prisma.clubTable.findFirst({ where: { id: tableId, clubId, deletedAt: null } });
    if (!table) {
      throw new NotFoundException("Table not found");
    }

    const existing = await this.prisma.tableSession.findFirst({
      where: { tableId, status: { in: ACTIVE_SESSION_STATUSES } }
    });
    if (existing) {
      throw new ConflictException("Table already has an active session");
    }

    const shift = await this.prisma.shift.findFirst({
      where: { clubId, status: ShiftStatus.OPEN },
      orderBy: { startedAt: "desc" }
    });

    return this.prisma.tableSession.create({
      data: {
        clubId,
        tableId,
        status: TableSessionStatus.ACTIVE,
        customerName: dto.customerName,
        shiftId: shift?.id ?? null
      },
      include: { table: { select: { id: true, name: true, kind: true } } }
    });
  }

  async addOrderItem(clubId: string, sessionId: string, dto: AddOrderItemDto, actor: RequestUser) {
    await assertClubAccess(this.prisma, clubId, actor);

    const session = await this.prisma.tableSession.findFirst({
      where: { id: sessionId, clubId, status: { in: ACTIVE_SESSION_STATUSES } }
    });
    if (!session) {
      throw new NotFoundException("Active session not found");
    }

    const menuItem = await this.prisma.menuItem.findFirst({
      where: { id: dto.menuItemId, clubId, deletedAt: null, isAvailable: true }
    });
    if (!menuItem) {
      throw new NotFoundException("Menu item not found");
    }

    const quantity = dto.quantity ?? 1;
    const lineTotal = menuItem.priceMinor * quantity;

    return this.prisma.$transaction(async (tx) => {
      const order = await this.findOrCreateOpenOrder(tx, clubId, session.tableId);
      await tx.menuOrderItem.create({
        data: {
          orderId: order.id,
          menuItemId: menuItem.id,
          quantity,
          priceMinor: menuItem.priceMinor
        }
      });

      return tx.menuOrder.update({
        where: { id: order.id },
        data: {
          subtotalMinor: { increment: lineTotal },
          totalMinor: { increment: lineTotal }
        },
        include: { items: { include: { menuItem: { select: { name: true } } } } }
      });
    });
  }

  async closeSession(clubId: string, sessionId: string, dto: CloseSessionDto, actor: RequestUser) {
    await assertClubAccess(this.prisma, clubId, actor);

    const session = await this.prisma.tableSession.findFirst({
      where: { id: sessionId, clubId, status: { in: ACTIVE_SESSION_STATUSES } },
      include: { table: { select: { id: true, name: true, kind: true } } }
    });
    if (!session) {
      throw new NotFoundException("Active session not found");
    }

    const club = await this.prisma.club.findUnique({ where: { id: clubId }, select: clubPricingSelect });
    const pricing = club ? resolveOptionalClubPricingConfig(club) : null;

    const endedAt = new Date();
    const quote = pricing ? calculateSessionPrice(session.table.kind, session.startedAt, endedAt, pricing) : null;
    const timePriceMinor = quote?.priceMinor ?? 0;
    const minutes = quote?.minutes ?? Math.max(0, Math.round((endedAt.getTime() - session.startedAt.getTime()) / 60_000));

    const openOrder = await this.prisma.menuOrder.findFirst({
      where: { clubId, tableId: session.tableId, status: { in: OPEN_ORDER_STATUSES } }
    });
    const barTotalMinor = openOrder?.totalMinor ?? 0;
    const totalMinor = timePriceMinor + barTotalMinor;

    const shift = dto.shiftId
      ? await this.prisma.shift.findFirst({ where: { id: dto.shiftId, clubId, status: ShiftStatus.OPEN } })
      : await this.prisma.shift.findFirst({
          where: { clubId, status: ShiftStatus.OPEN },
          orderBy: { startedAt: "desc" }
        });

    const closedSession = await this.prisma.$transaction(async (tx) => {
      const updatedSession = await tx.tableSession.update({
        where: { id: sessionId },
        data: {
          status: TableSessionStatus.FINISHED,
          endedAt,
          priceMinor: timePriceMinor,
          shiftId: shift?.id ?? session.shiftId
        }
      });

      if (openOrder) {
        await tx.menuOrder.update({
          where: { id: openOrder.id },
          data: { status: OrderStatus.PAID, paidAt: endedAt }
        });
      }

      if (shift) {
        if (timePriceMinor > 0) {
          await tx.transaction.create({
            data: {
              clubId,
              shiftId: shift.id,
              type: TransactionType.TABLE_SESSION,
              amountMinor: timePriceMinor,
              paymentMethod: dto.paymentMethod,
              tableSessionId: sessionId,
              description: `Стол ${session.table.name} · ${minutes} мин`
            }
          });
        }

        if (openOrder && barTotalMinor > 0) {
          await tx.transaction.create({
            data: {
              clubId,
              shiftId: shift.id,
              type: TransactionType.MENU_ORDER,
              amountMinor: barTotalMinor,
              paymentMethod: dto.paymentMethod,
              menuOrderId: openOrder.id,
              description: `Бар · заказ #${openOrder.orderNumber}`
            }
          });
        }

        if (totalMinor > 0) {
          await tx.shift.update({
            where: { id: shift.id },
            data: this.shiftTotalsIncrement(dto.paymentMethod, totalMinor)
          });
        }
      }

      return updatedSession;
    });

    return {
      session: closedSession,
      minutes,
      timePriceMinor,
      barTotalMinor,
      totalMinor,
      paymentMethod: dto.paymentMethod,
      recorded: Boolean(shift),
      shiftId: shift?.id ?? null,
      pricingConfigured: Boolean(pricing)
    };
  }

  private shiftTotalsIncrement(paymentMethod: PaymentMethod, amountMinor: number): Prisma.ShiftUpdateInput {
    const updates: Prisma.ShiftUpdateInput = {
      totalSalesMinor: { increment: amountMinor }
    };

    if (paymentMethod === PaymentMethod.CASH) {
      updates.totalCashMinor = { increment: amountMinor };
    } else if (paymentMethod === PaymentMethod.CARD || paymentMethod === PaymentMethod.TERMINAL) {
      updates.totalCardMinor = { increment: amountMinor };
    } else {
      updates.totalOnlineMinor = { increment: amountMinor };
    }

    return updates;
  }

  private async findOrCreateOpenOrder(tx: Prisma.TransactionClient, clubId: string, tableId: string) {
    const existing = await tx.menuOrder.findFirst({
      where: { clubId, tableId, status: { in: OPEN_ORDER_STATUSES } }
    });
    if (existing) {
      return existing;
    }

    const table = await tx.clubTable.findUnique({ where: { id: tableId }, select: { sortOrder: true } });
    const last = await tx.menuOrder.findFirst({
      where: { clubId },
      orderBy: { orderNumber: "desc" },
      select: { orderNumber: true }
    });

    return tx.menuOrder.create({
      data: {
        clubId,
        tableId,
        orderNumber: (last?.orderNumber ?? 0) + 1,
        tableNumber: table?.sortOrder ?? null,
        status: OrderStatus.PENDING
      }
    });
  }
}
