import { ConfigService } from "@nestjs/config";
import { Role } from "@prisma/client";

export type AuthCapability = "ADMIN_PANEL" | "PLAYER_VIEW";
type SpecialAuthProvider = "google" | "apple" | "facebook" | null | undefined;

export function normalizeEmail(value?: string | null) {
  return value?.trim().toLowerCase() ?? "";
}

export function isSpecialAdminEmail(configService: ConfigService, email?: string | null) {
  const specialEmail = normalizeEmail(configService.get<string>("SPECIAL_ADMIN_EMAIL"));
  return Boolean(specialEmail) && normalizeEmail(email) === specialEmail;
}

export function isSpecialGoogleAdmin(
  configService: ConfigService,
  input: { email?: string | null; authProvider?: SpecialAuthProvider }
) {
  return input.authProvider === "google" && isSpecialAdminEmail(configService, input.email);
}

export function hasAuthCapability(
  user: { capabilities?: AuthCapability[] | null } | undefined,
  capability: AuthCapability
) {
  return Boolean(user?.capabilities?.includes(capability));
}

function getRoleCapabilities(role: Role) {
  const capabilities: AuthCapability[] = [];

  if (role === Role.ADMIN) {
    capabilities.push("ADMIN_PANEL");
  }

  if (role === Role.PLAYER) {
    capabilities.push("PLAYER_VIEW");
  }

  return capabilities;
}

export function getAuthCapabilities(
  configService: ConfigService,
  user: { email?: string | null; role: Role },
  authContext?: { authProvider?: SpecialAuthProvider }
) {
  const capabilities = [...getRoleCapabilities(user.role)];
  const specialAdmin = isSpecialGoogleAdmin(configService, {
    email: user.email,
    authProvider: authContext?.authProvider
  });

  if (specialAdmin) {
    if (!capabilities.includes("ADMIN_PANEL")) {
      capabilities.push("ADMIN_PANEL");
    }
    if (!capabilities.includes("PLAYER_VIEW")) {
      capabilities.push("PLAYER_VIEW");
    }
  }

  return capabilities;
}

export function canAccessRole(
  _configService: ConfigService,
  user: { role?: Role; capabilities?: AuthCapability[] | null } | undefined,
  role: Role
) {
  if (!user?.role) {
    return false;
  }

  if (user.role === role) {
    return true;
  }

  if (role === Role.ADMIN) {
    return hasAuthCapability(user, "ADMIN_PANEL");
  }

  if (role === Role.PLAYER) {
    return hasAuthCapability(user, "PLAYER_VIEW");
  }

  return false;
}
