import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { OpenShiftDto, CloseShiftDto, CreateTransactionDto } from './dto';
import { ShiftStatus, PaymentMethod } from '@prisma/client';

@Injectable()
export class CashierService {
  constructor(private readonly prisma: PrismaService) {}

  // === SHIFT MANAGEMENT ===

  async openShift(clubId: string, dto: OpenShiftDto) {
    // Проверка существования сотрудника
    const staff = await this.prisma.staff.findFirst({
      where: { id: dto.staffId, clubId, isActive: true },
    });

    if (!staff) {
      throw new NotFoundException('Staff member not found or inactive');
    }

    // Проверка что у сотрудника нет открытой смены
    const existingOpenShift = await this.prisma.shift.findFirst({
      where: {
        staffId: dto.staffId,
        status: ShiftStatus.OPEN,
      },
    });

    if (existingOpenShift) {
      throw new ConflictException('Staff member already has an open shift');
    }

    return this.prisma.shift.create({
      data: {
        clubId,
        staffId: dto.staffId,
        status: ShiftStatus.OPEN,
        openingCashMinor: dto.openingCashMinor ?? 0,
        notes: dto.notes,
      },
      include: {
        staff: {
          select: {
            id: true,
            fullName: true,
            role: true,
          },
        },
      },
    });
  }

  async closeShift(clubId: string, shiftId: string, dto: CloseShiftDto) {
    const shift = await this.prisma.shift.findFirst({
      where: { id: shiftId, clubId },
      include: {
        staff: true,
      },
    });

    if (!shift) {
      throw new NotFoundException('Shift not found');
    }

    if (shift.status !== ShiftStatus.OPEN) {
      throw new BadRequestException('Shift is already closed');
    }

    return this.prisma.shift.update({
      where: { id: shiftId },
      data: {
        status: ShiftStatus.CLOSED,
        endedAt: new Date(),
        closingCashMinor: dto.closingCashMinor,
        notes: dto.notes
          ? shift.notes
            ? `${shift.notes}\n${dto.notes}`
            : dto.notes
          : shift.notes,
      },
      include: {
        staff: {
          select: {
            id: true,
            fullName: true,
            role: true,
          },
        },
      },
    });
  }

  async getCurrentShift(clubId: string, staffId: string) {
    const shift = await this.prisma.shift.findFirst({
      where: {
        clubId,
        staffId,
        status: ShiftStatus.OPEN,
      },
      include: {
        staff: {
          select: {
            id: true,
            fullName: true,
            role: true,
          },
        },
        _count: {
          select: {
            transactions: true,
          },
        },
      },
      orderBy: { startedAt: 'desc' },
    });

    if (!shift) {
      throw new NotFoundException('No open shift found for this staff member');
    }

    return shift;
  }

  async getShiftHistory(clubId: string, limit = 50) {
    return this.prisma.shift.findMany({
      where: { clubId },
      include: {
        staff: {
          select: {
            id: true,
            fullName: true,
            role: true,
          },
        },
        _count: {
          select: {
            transactions: true,
          },
        },
      },
      orderBy: { startedAt: 'desc' },
      take: limit,
    });
  }

  // === TRANSACTION MANAGEMENT ===

  async createTransaction(clubId: string, shiftId: string, dto: CreateTransactionDto) {
    // Проверка что смена открыта
    const shift = await this.prisma.shift.findFirst({
      where: { id: shiftId, clubId, status: ShiftStatus.OPEN },
    });

    if (!shift) {
      throw new NotFoundException('Open shift not found');
    }

    // Создание транзакции и обновление итогов смены в транзакции БД
    const result = await this.prisma.$transaction(async (tx) => {
      // Создаём транзакцию
      const transaction = await tx.transaction.create({
        data: {
          clubId,
          shiftId,
          type: dto.type,
          amountMinor: dto.amountMinor,
          paymentMethod: dto.paymentMethod,
          bookingId: dto.bookingId,
          tableSessionId: dto.tableSessionId,
          menuOrderId: dto.menuOrderId,
          description: dto.description,
          metadata: dto.metadata,
        },
      });

      // Обновляем итоги смены
      const updates: any = {
        totalSalesMinor: { increment: dto.amountMinor },
      };

      if (dto.paymentMethod === PaymentMethod.CASH) {
        updates.totalCashMinor = { increment: dto.amountMinor };
      } else if (dto.paymentMethod === PaymentMethod.CARD || dto.paymentMethod === PaymentMethod.TERMINAL) {
        updates.totalCardMinor = { increment: dto.amountMinor };
      } else if (dto.paymentMethod === PaymentMethod.ONLINE || dto.paymentMethod === PaymentMethod.TRANSFER) {
        updates.totalOnlineMinor = { increment: dto.amountMinor };
      }

      await tx.shift.update({
        where: { id: shiftId },
        data: updates,
      });

      return transaction;
    });

    return result;
  }

  async getTransactions(clubId: string, shiftId: string) {
    // Проверка существования смены
    const shift = await this.prisma.shift.findFirst({
      where: { id: shiftId, clubId },
    });

    if (!shift) {
      throw new NotFoundException('Shift not found');
    }

    return this.prisma.transaction.findMany({
      where: { shiftId },
      orderBy: { createdAt: 'desc' },
      include: {
        booking: {
          select: {
            id: true,
            tableNumber: true,
            startAt: true,
          },
        },
        tableSession: {
          select: {
            id: true,
            tableId: true,
            customerName: true,
          },
        },
        menuOrder: {
          select: {
            id: true,
            orderNumber: true,
            tableNumber: true,
          },
        },
      },
    });
  }

  // === REPORTS ===

  async getDailyReport(clubId: string, date: Date) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const shifts = await this.prisma.shift.findMany({
      where: {
        clubId,
        startedAt: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      include: {
        staff: {
          select: {
            id: true,
            fullName: true,
            role: true,
          },
        },
        _count: {
          select: {
            transactions: true,
          },
        },
      },
    });

    const totalSales = shifts.reduce((sum: number, shift) => sum + shift.totalSalesMinor, 0);
    const totalCash = shifts.reduce((sum: number, shift) => sum + shift.totalCashMinor, 0);
    const totalCard = shifts.reduce((sum: number, shift) => sum + shift.totalCardMinor, 0);
    const totalOnline = shifts.reduce((sum: number, shift) => sum + shift.totalOnlineMinor, 0);

    return {
      date,
      shifts,
      summary: {
        totalSalesMinor: totalSales,
        totalCashMinor: totalCash,
        totalCardMinor: totalCard,
        totalOnlineMinor: totalOnline,
        shiftsCount: shifts.length,
      },
    };
  }
}
