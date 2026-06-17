import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { UsersService } from "./users.service";
import { Roles } from "../common/roles.decorator";
import { Role } from "@prisma/client";
import { RolesGuard } from "../common/roles.guard";
import { JwtAccessGuard } from "../auth/jwt-access.guard";
import { CreateUserAdminDto, UpdateUserAdminDto } from "./dto";

@Controller("users")
@UseGuards(JwtAccessGuard, RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @Roles(Role.ADMIN)
  findAll() {
    return this.usersService.findAll();
  }

  @Post()
  @Roles(Role.ADMIN)
  create(@Body() dto: CreateUserAdminDto) {
    return this.usersService.create(dto);
  }

  @Patch(":id")
  @Roles(Role.ADMIN)
  update(@Param("id") id: string, @Body() dto: UpdateUserAdminDto) {
    return this.usersService.updateAdmin(id, dto);
  }

  @Delete(":id")
  @Roles(Role.ADMIN)
  remove(@Param("id") id: string) {
    return this.usersService.deleteAdmin(id);
  }
}
