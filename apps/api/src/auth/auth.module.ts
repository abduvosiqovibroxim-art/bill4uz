import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { ConfigModule } from "@nestjs/config";
import { PassportModule } from "@nestjs/passport";
import { AuthService } from "./auth.service";
import { AuthController } from "./auth.controller";
import { AccessTokenStrategy } from "./access-token.strategy";
import { RefreshTokenStrategy } from "./refresh-token.strategy";
import { JwtAccessGuard } from "./jwt-access.guard";
import { JwtRefreshGuard } from "./jwt-refresh.guard";
import { RolesGuard } from "../common/roles.guard";
import { EmailModule } from "../email/email.module";

@Module({
  imports: [ConfigModule, PassportModule, JwtModule.register({}), EmailModule],
  controllers: [AuthController],
  providers: [
    AuthService,
    AccessTokenStrategy,
    RefreshTokenStrategy,
    JwtAccessGuard,
    JwtRefreshGuard,
    RolesGuard
  ],
  exports: [AuthService, JwtAccessGuard, JwtRefreshGuard, RolesGuard]
})
export class AuthModule {}
