import { ConfigService } from "@nestjs/config";
import { Role } from "@prisma/client";
import { Response } from "express";
import { durationToMs } from "../common/duration";
import type { AuthCapability } from "./special-access";

export function getRefreshCookieName(configService: ConfigService): string {
  return configService.get<string>("JWT_REFRESH_COOKIE_NAME", "billard_refresh_token");
}

export function getRoleCookieName() {
  return "billard_role";
}

export function getCapabilitiesCookieName() {
  return "billard_capabilities";
}

export function getOAuthStateCookieName(provider: string) {
  return `billard_oauth_${provider}_state`;
}

function isSecureCookie(configService: ConfigService) {
  const explicitValue = configService.get<string>("AUTH_COOKIE_SECURE");
  if (explicitValue === "true") {
    return true;
  }

  if (explicitValue === "false") {
    return false;
  }

  return configService.get<string>("NODE_ENV") === "production";
}

function refreshCookieLifetime(configService: ConfigService) {
  const maxAge = durationToMs(configService.get<string>("JWT_REFRESH_EXPIRES_IN", "30d"));

  return {
    maxAge,
    expires: new Date(Date.now() + maxAge)
  };
}

export function setRefreshTokenCookie(response: Response, configService: ConfigService, refreshToken: string) {
  response.cookie(getRefreshCookieName(configService), refreshToken, {
    httpOnly: true,
    sameSite: "lax",
    secure: isSecureCookie(configService),
    path: "/",
    ...refreshCookieLifetime(configService)
  });
}

export function clearRefreshTokenCookie(response: Response, configService: ConfigService) {
  response.clearCookie(getRefreshCookieName(configService), {
    httpOnly: true,
    sameSite: "lax",
    secure: isSecureCookie(configService),
    path: "/"
  });
}

export function setRoleCookie(response: Response, configService: ConfigService, role: Role) {
  response.cookie(getRoleCookieName(), role, {
    httpOnly: true,
    sameSite: "lax",
    secure: isSecureCookie(configService),
    path: "/",
    ...refreshCookieLifetime(configService)
  });
}

export function clearRoleCookie(response: Response, configService: ConfigService) {
  response.clearCookie(getRoleCookieName(), {
    httpOnly: true,
    sameSite: "lax",
    secure: isSecureCookie(configService),
    path: "/"
  });
}

export function setCapabilitiesCookie(
  response: Response,
  configService: ConfigService,
  capabilities: AuthCapability[]
) {
  response.cookie(getCapabilitiesCookieName(), capabilities.join(","), {
    httpOnly: true,
    sameSite: "lax",
    secure: isSecureCookie(configService),
    path: "/",
    ...refreshCookieLifetime(configService)
  });
}

export function clearCapabilitiesCookie(response: Response, configService: ConfigService) {
  response.clearCookie(getCapabilitiesCookieName(), {
    httpOnly: true,
    sameSite: "lax",
    secure: isSecureCookie(configService),
    path: "/"
  });
}

export function setOAuthStateCookie(response: Response, configService: ConfigService, provider: string, value: string) {
  response.cookie(getOAuthStateCookieName(provider), value, {
    httpOnly: true,
    sameSite: "lax",
    secure: isSecureCookie(configService),
    path: "/api/auth/oauth",
    maxAge: durationToMs("10m")
  });
}

export function clearOAuthStateCookie(response: Response, configService: ConfigService, provider: string) {
  response.clearCookie(getOAuthStateCookieName(provider), {
    httpOnly: true,
    sameSite: "lax",
    secure: isSecureCookie(configService),
    path: "/api/auth/oauth"
  });
}
