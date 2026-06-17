import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { JwtAccessPayload, RequestUser } from "./dto";

@Injectable()
export class AccessTokenStrategy extends PassportStrategy(Strategy, "jwt-access") {
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: configService.get<string>("JWT_ACCESS_SECRET", "dev-access-secret"),
      ignoreExpiration: false
    });
  }

  validate(payload: JwtAccessPayload): RequestUser {
    if (payload.type !== "access") {
      throw new UnauthorizedException("Invalid access token");
    }

    return payload;
  }
}
