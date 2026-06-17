import * as assert from "node:assert/strict";
import { Role } from "@prisma/client";
import { canAccessRole, getAuthCapabilities } from "../src/auth/special-access";

const configService = {
  get(name: string) {
    return name === "SPECIAL_ADMIN_EMAIL" ? "admin@example.com" : "";
  }
} as const;

const googleAdminCapabilities = getAuthCapabilities(
  configService as never,
  { email: "admin@example.com", role: Role.PLAYER },
  { authProvider: "google" }
);
assert.deepEqual(googleAdminCapabilities, ["PLAYER_VIEW", "ADMIN_PANEL"]);

const plainGoogleUserCapabilities = getAuthCapabilities(
  configService as never,
  { email: "user@example.com", role: Role.PLAYER },
  { authProvider: "google" }
);
assert.deepEqual(plainGoogleUserCapabilities, ["PLAYER_VIEW"]);

const emailPasswordMatchingEmailCapabilities = getAuthCapabilities(
  configService as never,
  { email: "admin@example.com", role: Role.PLAYER },
  { authProvider: undefined }
);
assert.deepEqual(emailPasswordMatchingEmailCapabilities, ["PLAYER_VIEW"]);

assert.equal(
  canAccessRole(configService as never, { role: Role.PLAYER, capabilities: googleAdminCapabilities }, Role.ADMIN),
  true
);
assert.equal(
  canAccessRole(configService as never, { role: Role.PLAYER, capabilities: plainGoogleUserCapabilities }, Role.ADMIN),
  false
);
