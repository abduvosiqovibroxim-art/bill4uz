import { Role } from "@prisma/client";
import { IsEmail, IsEnum, IsOptional, IsString, MinLength, ValidateIf } from "class-validator";
import type { AuthCapability } from "./special-access";

export class SignInDto {
  @IsString({ message: "Введите телефон или email" })
  @MinLength(1, { message: "Введите телефон или email" })
  identifier!: string;

  @IsString({ message: "Введите пароль" })
  @MinLength(6, { message: "Пароль должен содержать минимум 6 символов" })
  password!: string;
}

export class SignUpDto {
  @IsOptional()
  @IsEnum(Role)
  role?: Role;

  @ValidateIf((dto: SignUpDto) => {
    const role = dto.role ?? Role.PLAYER;
    return role === Role.PLAYER || role === Role.ORGANIZER;
  })
  @IsString({ message: "Введите имя" })
  @MinLength(1, { message: "Введите имя" })
  firstName?: string;

  @ValidateIf((dto: SignUpDto) => {
    const role = dto.role ?? Role.PLAYER;
    return role === Role.PLAYER || role === Role.ORGANIZER;
  })
  @IsString({ message: "Введите фамилию" })
  @MinLength(1, { message: "Введите фамилию" })
  lastName?: string;

  @ValidateIf((dto: SignUpDto) => dto.role === Role.CLUB)
  @IsString({ message: "Введите название клуба" })
  @MinLength(1, { message: "Введите название клуба" })
  clubName?: string;

  @IsString({ message: "Введите номер телефона" })
  @MinLength(1, { message: "Введите номер телефона" })
  phone!: string;

  @IsString({ message: "Выберите город" })
  @MinLength(1, { message: "Выберите город" })
  cityId!: string;

  @IsString({ message: "Введите пароль" })
  @MinLength(6, { message: "Пароль должен содержать минимум 6 символов" })
  password!: string;
}

export class VerifyEmailDto {
  @IsString()
  token!: string;
}

export class ResendVerificationDto {
  @IsEmail()
  email!: string;
}

export class ForgotPasswordDto {
  @IsEmail()
  email!: string;
}

export class ResetPasswordDto {
  @IsString()
  token!: string;

  @IsString()
  @MinLength(6)
  password!: string;
}

export class ChangePasswordDto {
  @IsString()
  @MinLength(6)
  currentPassword!: string;

  @IsString()
  @MinLength(6)
  newPassword!: string;
}

export interface SessionUserDto {
  id: string;
  email: string;
  phone: string | null;
  role: Role;
  capabilities: AuthCapability[];
  isVerified: boolean;
  createdAt: Date;
}

export interface PublicAuthSessionDto {
  accessToken: string;
  user: SessionUserDto;
}

export interface AuthActionResultDto {
  success: boolean;
  message: string;
}

export interface IssuedAuthSessionDto extends PublicAuthSessionDto {
  refreshToken: string;
}

export interface JwtAccessPayload {
  sub: string;
  email: string;
  role: Role;
  capabilities: AuthCapability[];
  type: "access";
}

export interface JwtRefreshPayload {
  sub: string;
  email: string;
  role: Role;
  capabilities: AuthCapability[];
  type: "refresh";
  jti: string;
}

export interface RequestUser {
  sub: string;
  email: string;
  role: Role;
  capabilities: AuthCapability[];
  type: "access" | "refresh";
  jti?: string;
}

export type OAuthProvider = "google" | "apple" | "facebook";
