import { Body, Controller, Get, Param, Patch, Req, UseGuards } from "@nestjs/common";
import { Role } from "@prisma/client";
import { JwtAccessGuard } from "../auth/jwt-access.guard";
import { RequestUser } from "../auth/dto";
import { Roles } from "../common/roles.decorator";
import { RolesGuard } from "../common/roles.guard";
import { RateLimit } from "../platform/rate-limit.decorator";
import { RateLimitGuard } from "../platform/rate-limit.guard";
import { PlayersService } from "./players.service";
import { AdminUpdatePlayerDto, UpdatePlayerAvatarDto } from "./dto";

@Controller("players")
export class PlayersController {
  constructor(private readonly playersService: PlayersService) {}

  @Get()
  findAll() {
    return this.playersService.findAll();
  }

  @UseGuards(RateLimitGuard, JwtAccessGuard)
  @Patch("me/avatar")
  @RateLimit({ bucket: "player-avatar-update", limit: 10, windowMs: 60_000 })
  updateOwnAvatar(@Req() request: { user: RequestUser }, @Body() dto: UpdatePlayerAvatarDto) {
    return this.playersService.updateOwnAvatar(request.user.sub, dto.avatarUrl);
  }

  @UseGuards(JwtAccessGuard, RolesGuard)
  @Patch(":id/admin")
  @Roles(Role.ADMIN)
  updateByAdmin(@Param("id") id: string, @Body() dto: AdminUpdatePlayerDto) {
    return this.playersService.updateByAdmin(id, dto);
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.playersService.findOne(id);
  }
}
