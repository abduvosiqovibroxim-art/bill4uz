export type AuthRole = "PLAYER" | "CLUB" | "ORGANIZER" | "ADMIN";
export type AuthCapability = "ADMIN_PANEL" | "PLAYER_VIEW";
export type AuthStatus = "loading" | "authenticated" | "anonymous";

export interface AuthUser {
  id: string;
  email: string;
  phone: string | null;
  role: AuthRole;
  capabilities?: AuthCapability[];
  isVerified: boolean;
  createdAt: string;
}

export interface AuthSession {
  accessToken: string;
  user: AuthUser;
}

export interface AuthActionResult {
  success: boolean;
  message: string;
}

export interface SignInInput {
  identifier: string;
  password: string;
}

export interface SignUpInput {
  role?: "PLAYER" | "ORGANIZER";
  firstName?: string;
  lastName?: string;
  phone: string;
  cityId: string;
  password: string;
}

export interface ChangePasswordInput {
  currentPassword: string;
  newPassword: string;
}
