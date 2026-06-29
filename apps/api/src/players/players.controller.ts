import { Body, Controller, Get, Param, Patch, Req, UseGuards } from "@nestjs/common";
import { JwtAccessGuard } from "../auth/jwt-access.guard";
import { RequestUser } from "../auth/dto";
import { RateLimit } from "../platform/rate-limit.decorator";
import { RateLimitGuard } from "../platform/rate-limit.guard";
import { PlayersService } from "./players.service";
import { UpdatePlayerAvatarDto } from "./dto";

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

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.playersService.findOne(id);
  }
}
