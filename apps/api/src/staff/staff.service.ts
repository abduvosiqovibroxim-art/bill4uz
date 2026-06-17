import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { CreateStaffDto, UpdateStaffDto } from './dto';

@Injectable()
export class StaffService {
  constructor(private readonly prisma: PrismaService) {}

  async create(clubId: string, dto: CreateStaffDto) {
    // Проверка существования клуба
    const club = await this.prisma.club.findUnique({
      where: { id: clubId },
    });

    if (!club) {
      throw new NotFoundException('Club not found');
    }

    // Если указан userId, проверяем что User существует
    if (dto.userId) {
      const user = await this.prisma.user.findUnique({
        where: { id: dto.userId },
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      // Проверяем что у пользователя роль STAFF
      if (user.role !== 'STAFF') {
        throw new ForbiddenException('User must have STAFF role');
      }
    }

    return this.prisma.staff.create({
      data: {
        clubId,
        ...dto,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            phone: true,
          },
        },
      },
    });
  }

  async findAll(clubId: string, includeInactive = false) {
    return this.prisma.staff.findMany({
      where: {
        clubId,
        ...(includeInactive ? {} : { isActive: true }),
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            phone: true,
          },
        },
        _count: {
          select: {
            shifts: true,
          },
        },
      },
      orderBy: [
        { isActive: 'desc' },
        { hireDate: 'desc' },
      ],
    });
  }

  async findOne(clubId: string, id: string) {
    const staff = await this.prisma.staff.findFirst({
      where: { id, clubId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            phone: true,
          },
        },
        shifts: {
          take: 10,
          orderBy: { startedAt: 'desc' },
          select: {
            id: true,
            startedAt: true,
            endedAt: true,
            status: true,
            totalSalesMinor: true,
          },
        },
      },
    });

    if (!staff) {
      throw new NotFoundException('Staff member not found');
    }

    return staff;
  }

  async update(clubId: string, id: string, dto: UpdateStaffDto) {
    // Проверка существования
    await this.findOne(clubId, id);

    return this.prisma.staff.update({
      where: { id },
      data: dto,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            phone: true,
          },
        },
      },
    });
  }

  async remove(clubId: string, id: string) {
    // Проверка существования
    const staff = await this.findOne(clubId, id);

    // Мягкое удаление - помечаем как неактивного
    return this.prisma.staff.update({
      where: { id },
      data: {
        isActive: false,
        terminationDate: new Date(),
      },
    });
  }

  async getShiftHistory(clubId: string, staffId: string) {
    // Проверка существования
    await this.findOne(clubId, staffId);

    return this.prisma.shift.findMany({
      where: { staffId },
      orderBy: { startedAt: 'desc' },
      take: 50,
      select: {
        id: true,
        startedAt: true,
        endedAt: true,
        status: true,
        totalSalesMinor: true,
        totalCashMinor: true,
        totalCardMinor: true,
        totalOnlineMinor: true,
        openingCashMinor: true,
        closingCashMinor: true,
      },
    });
  }
}
