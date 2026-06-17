import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { Request } from "express";
import { readCookieValue } from "../common/cookies";
import { JwtRefreshPayload, RequestUser } from "./dto";
import { getRefreshCookieName } from "./cookie";

@Injectable()
export class RefreshTokenStrategy extends PassportStrategy(Strategy, "jwt-refresh") {
  private readonly cookieName: string;

  constructor(private readonly configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request: Request) => readCookieValue(request.headers.cookie, getRefreshCookieName(configService))
      ]),
      secretOrKey: configService.get<string>("JWT_REFRESH_SECRET", "dev-refresh-secret"),
      ignoreExpiration: false,
      passReqToCallback: true
    });
    this.cookieName = getRefreshCookieName(configService);
  }

  validate(request: Request, payload: JwtRefreshPayload): RequestUser {
    if (payload.type !== "refresh") {
      throw new UnauthorizedException("Invalid refresh token");
    }

    const refreshToken = readCookieValue(request.headers.cookie, this.cookieName);
    if (!refreshToken) {
      throw new UnauthorizedException("Refresh token is required");
    }

    return payload;
  }
}
