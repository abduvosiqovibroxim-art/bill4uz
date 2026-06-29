import { Injectable } from "@nestjs/common";
import { Role } from "@prisma/client";
import { PrismaService } from "../common/prisma.service";
import { hashPassword } from "../common/password";

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.user.findMany({
      select: { id: true, email: true, role: true, isVerified: true, createdAt: true },
      orderBy: { createdAt: "desc" }
    });
  }

  findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }

  findSessionUserById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        role: true,
        isVerified: true,
        createdAt: true,
        passwordHash: true
      }
    });
  }

  async create(input: { email: string; password: string; role: Role; isVerified?: boolean }) {
    const passwordHash = await hashPassword(input.password);

    return this.prisma.user.create({
      data: {
        email: input.email,
        passwordHash,
        role: input.role,
        isVerified: input.isVerified ?? false
      },
      select: {
        id: true,
        email: true,
        role: true,
        isVerified: true,
        createdAt: true
      }
    });
  }

  updateAdmin(id: string, input: { role?: Role; isVerified?: boolean }) {
    return this.prisma.user.update({
      where: { id },
      data: {
        role: input.role,
        isVerified: input.isVerified
      },
      select: {
        id: true,
        email: true,
        role: true,
        isVerified: true,
        createdAt: true
      }
    });
  }

  deleteAdmin(id: string) {
    // A user can own a Player profile whose dependent rows (applications,
    // rankings, matches, captained teams) and the user's notifications have
    // no cascade FK, so a bare user.delete() fails with a constraint error.
    // Clear those blockers first inside a transaction, then delete the user.
    return this.prisma.$transaction(async (tx) => {
      const player = await tx.player.findUnique({ where: { userId: id }, select: { id: true } });

      if (player) {
        const playerId = player.id;
        await tx.application.deleteMany({ where: { playerId } });
        await tx.ranking.deleteMany({ where: { playerId } });
        await tx.match.deleteMany({ where: { OR: [{ playerAId: playerId }, { playerBId: playerId }] } });
        await tx.team.deleteMany({ where: { captainId: playerId } });
        await tx.player.delete({ where: { id: playerId } });
      }

      await tx.notification.deleteMany({ where: { userId: id } });

      return tx.user.delete({ where: { id }, select: { id: true } });
    });
  }
}
