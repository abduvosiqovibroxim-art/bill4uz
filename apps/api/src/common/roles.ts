import { Role } from "@prisma/client";

export const ROLE_VALUES = [Role.PLAYER, Role.CLUB, Role.ORGANIZER, Role.ADMIN, Role.STAFF] as const;
export type AppRole = Role;

export const DASHBOARD_PATH_BY_ROLE: Record<Role, string> = {
  [Role.PLAYER]: "/dashboard/player",
  [Role.CLUB]: "/dashboard/club",
  [Role.ORGANIZER]: "/dashboard/organizer",
  [Role.ADMIN]: "/dashboard/admin",
  [Role.STAFF]: "/dashboard/staff"
};

export function isRole(value: unknown): value is Role {
  return typeof value === "string" && ROLE_VALUES.includes(value as Role);
}
