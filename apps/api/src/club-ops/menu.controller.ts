import { Body, Controller, Delete, Get, Param, Patch, Post, Req, UseGuards } from "@nestjs/common";
import { Role } from "@prisma/client";
import { JwtAccessGuard } from "../auth/jwt-access.guard";
import { RequestUser } from "../auth/dto";
import { Roles } from "../common/roles.decorator";
import { RolesGuard } from "../common/roles.guard";
import { MenuService } from "./menu.service";
import { CreateMenuItemDto, UpdateMenuItemDto } from "./dto";

@UseGuards(JwtAccessGuard, RolesGuard)
@Roles(Role.CLUB, Role.ADMIN)
@Controller("clubs/:clubId/menu")
export class MenuController {
  constructor(private readonly menuService: MenuService) {}

  @Get()
  list(@Param("clubId") clubId: string, @Req() request: { user: RequestUser }) {
    return this.menuService.listMenu(clubId, request.user);
  }

  @Post()
  create(@Param("clubId") clubId: string, @Body() dto: CreateMenuItemDto, @Req() request: { user: RequestUser }) {
    return this.menuService.createMenuItem(clubId, dto, request.user);
  }

  @Patch(":itemId")
  update(
    @Param("clubId") clubId: string,
    @Param("itemId") itemId: string,
    @Body() dto: UpdateMenuItemDto,
    @Req() request: { user: RequestUser }
  ) {
    return this.menuService.updateMenuItem(clubId, itemId, dto, request.user);
  }

  @Delete(":itemId")
  remove(@Param("clubId") clubId: string, @Param("itemId") itemId: string, @Req() request: { user: RequestUser }) {
    return this.menuService.deleteMenuItem(clubId, itemId, request.user);
  }
}
