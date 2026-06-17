import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { timingSafeEqual } from "crypto";

@Injectable()
export class BotInternalGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<{ headers?: Record<string, string | string[] | undefined> }>();
    const headerValue = request.headers?.["x-bot-secret"];
    const providedSecret = Array.isArray(headerValue) ? headerValue[0] : headerValue;
    const expectedSecret = this.configService.get<string>("BOT_INTERNAL_SECRET", "").trim();

    if (!expectedSecret || !providedSecret || !safeEqual(providedSecret, expectedSecret)) {
      throw new UnauthorizedException("Bot access denied");
    }

    return true;
  }
}

function safeEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}
