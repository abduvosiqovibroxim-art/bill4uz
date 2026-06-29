import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../common/prisma.service";
import { RequestUser } from "../auth/dto";
import { assertClubAccess } from "./access";
import { CreateMenuItemDto, UpdateMenuItemDto } from "./dto";

@Injectable()
export class MenuService {
  constructor(private readonly prisma: PrismaService) {}

  async listMenu(clubId: string, actor: RequestUser) {
    await assertClubAccess(this.prisma, clubId, actor);
    return this.prisma.menuItem.findMany({
      where: { clubId, deletedAt: null },
      orderBy: [{ category: "asc" }, { sortOrder: "asc" }, { name: "asc" }]
    });
  }

  async createMenuItem(clubId: string, dto: CreateMenuItemDto, actor: RequestUser) {
    await assertClubAccess(this.prisma, clubId, actor);
    return this.prisma.menuItem.create({
      data: {
        clubId,
        name: dto.name,
        nameEn: dto.nameEn,
        nameUz: dto.nameUz,
        category: dto.category,
        priceMinor: dto.priceMinor,
        imageUrl: dto.imageUrl,
        sortOrder: dto.sortOrder ?? 0
      }
    });
  }

  async updateMenuItem(clubId: string, itemId: string, dto: UpdateMenuItemDto, actor: RequestUser) {
    await assertClubAccess(this.prisma, clubId, actor);
    const item = await this.prisma.menuItem.findFirst({ where: { id: itemId, clubId, deletedAt: null } });
    if (!item) {
      throw new NotFoundException("Menu item not found");
    }

    return this.prisma.menuItem.update({
      where: { id: itemId },
      data: {
        name: dto.name,
        nameEn: dto.nameEn,
        nameUz: dto.nameUz,
        category: dto.category,
        priceMinor: dto.priceMinor,
        imageUrl: dto.imageUrl,
        isAvailable: dto.isAvailable,
        sortOrder: dto.sortOrder
      }
    });
  }

  async deleteMenuItem(clubId: string, itemId: string, actor: RequestUser) {
    await assertClubAccess(this.prisma, clubId, actor);
    const item = await this.prisma.menuItem.findFirst({ where: { id: itemId, clubId, deletedAt: null } });
    if (!item) {
      throw new NotFoundException("Menu item not found");
    }

    return this.prisma.menuItem.update({
      where: { id: itemId },
      data: { deletedAt: new Date(), isAvailable: false }
    });
  }
}
