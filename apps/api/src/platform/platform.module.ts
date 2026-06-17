import { Global, Module } from "@nestjs/common";
import { AuditService } from "./audit.service";
import { RateLimitGuard } from "./rate-limit.guard";
import { RateLimitService } from "./rate-limit.service";

@Global()
@Module({
  providers: [AuditService, RateLimitService, RateLimitGuard],
  exports: [AuditService, RateLimitService, RateLimitGuard]
})
export class PlatformModule {}
