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
    return this.prisma.user.delete({
      where: { id },
      select: {
        id: true
      }
    });
  }
}
