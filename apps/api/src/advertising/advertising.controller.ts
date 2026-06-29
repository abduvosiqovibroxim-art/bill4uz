import { Body, Controller, Post, UseGuards } from "@nestjs/common";
import { RateLimit } from "../platform/rate-limit.decorator";
import { RateLimitGuard } from "../platform/rate-limit.guard";
import { AdvertisingService } from "./advertising.service";
import { CreateAdvertisingRequestDto } from "./dto";

@Controller("advertising-requests")
export class AdvertisingController {
  constructor(private readonly advertisingService: AdvertisingService) {}

  @UseGuards(RateLimitGuard)
  @Post()
  @RateLimit({ bucket: "advertising-request-create", limit: 5, windowMs: 60_000 })
  submit(@Body() dto: CreateAdvertisingRequestDto) {
    return this.advertisingService.create(dto);
  }
}
