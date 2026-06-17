import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { RATE_LIMIT_OPTIONS, RateLimitOptions } from "./rate-limit.decorator";
import { RateLimitService } from "./rate-limit.service";

@Injectable()
export class RateLimitGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly rateLimitService: RateLimitService
  ) {}

  canActivate(context: ExecutionContext) {
    const options = this.reflector.getAllAndOverride<RateLimitOptions>(RATE_LIMIT_OPTIONS, [
      context.getHandler(),
      context.getClass()
    ]);

    if (!options) {
      return true;
    }

    const request = context.switchToHttp().getRequest<{
      ip?: string;
      headers?: Record<string, string | string[] | undefined>;
      user?: { sub?: string };
    }>();
    const forwardedFor = request.headers?.["x-forwarded-for"];
    const forwardedIp = Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor;
    const actorKey = request.user?.sub?.trim() || request.ip || forwardedIp || "anonymous";
    const bucketKey = `${options.bucket}:${actorKey}`;
    const result = this.rateLimitService.check(bucketKey, options.limit, options.windowMs);

    if (!result.allowed) {
      throw new HttpException(
        `Too many requests. Try again in ${Math.ceil(result.retryAfterMs / 1000)} seconds.`,
        HttpStatus.TOO_MANY_REQUESTS
      );
    }

    return true;
  }
}
