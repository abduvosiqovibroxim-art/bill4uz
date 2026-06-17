import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards } from "@nestjs/common";
import { Role } from "@prisma/client";
import { JwtAccessGuard } from "../auth/jwt-access.guard";
import { RequestUser } from "../auth/dto";
import { Roles } from "../common/roles.decorator";
import { RolesGuard } from "../common/roles.guard";
import { RateLimitGuard } from "../platform/rate-limit.guard";
import { RateLimit } from "../platform/rate-limit.decorator";
import { ClubImportService } from "./club-import.service";
import { ClubsService } from "./clubs.service";
import { CreateClubDto, UpdateClubDto } from "./dto";

@Controller("clubs")
export class ClubsController {
  constructor(private readonly clubsService: ClubsService) {}

  @Get()
  findAll(@Query("city") city?: string) {
    return this.clubsService.findAll(city);
  }

  @UseGuards(JwtAccessGuard)
  @Get("me")
  findMine(@Req() request: { user: RequestUser }) {
    return this.clubsService.findMine(request.user);
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.clubsService.findOne(id);
  }

  @UseGuards(RateLimitGuard, JwtAccessGuard, RolesGuard)
  @Post()
  @Roles(Role.ADMIN)
  @RateLimit({ bucket: "clubs-create", limit: 10, windowMs: 60_000 })
  create(@Body() dto: CreateClubDto, @Req() request: { user: RequestUser }) {
    return this.clubsService.create(dto, request.user);
  }

  @UseGuards(RateLimitGuard, JwtAccessGuard, RolesGuard)
  @Patch(":id")
  @Roles(Role.ADMIN)
  @RateLimit({ bucket: "clubs-update", limit: 20, windowMs: 60_000 })
  update(@Param("id") id: string, @Req() request: { user: RequestUser }, @Body() dto: UpdateClubDto) {
    return this.clubsService.update(id, dto, request.user);
  }

  @UseGuards(JwtAccessGuard, RolesGuard)
  @Delete(":id")
  @Roles(Role.ADMIN)
  remove(@Param("id") id: string, @Req() request: { user: RequestUser }) {
    return this.clubsService.remove(id, request.user);
  }
}

@Controller("admin/clubs")
export class AdminClubsController {
  constructor(private readonly clubImportService: ClubImportService) {}

  @UseGuards(JwtAccessGuard, RolesGuard)
  @Post("import-map")
  @Roles(Role.ADMIN)
  importFromMap(@Req() request: { user: RequestUser }) {
    return this.clubImportService.syncRealBilliardClubsFromYandex(request.user);
  }
}
