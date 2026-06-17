import { randomBytes, randomUUID } from "crypto";
import { BadRequestException, ConflictException, ForbiddenException, Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { AuthTokenType, RefreshToken, Role, User } from "@prisma/client";
import { JwtService } from "@nestjs/jwt";
import { readCookieValue } from "../common/cookies";
import { durationToMs } from "../common/duration";
import { hashPassword, verifyPassword } from "../common/password";
import { PrismaService } from "../common/prisma.service";
import { hashToken, verifyTokenHash } from "../common/token";
import { EmailService } from "../email/email.service";
import {
  AuthActionResultDto,
  IssuedAuthSessionDto,
  OAuthProvider,
  PublicAuthSessionDto,
  RequestUser,
  SessionUserDto,
  SignUpDto
} from "./dto";
import { getRefreshCookieName } from "./cookie";
import { getAuthCapabilities, type AuthCapability } from "./special-access";

interface OAuthStartResult {
  authorizationUrl: string;
  state: string;
  nextPath: string;
}

interface OAuthCompletionInput {
  code?: string;
  state?: string;
  storedStatePayload?: string | null;
  userPayload?: unknown;
}

interface OAuthCompletionResult {
  session: IssuedAuthSessionDto;
  nextPath: string;
}

interface OAuthProfile {
  providerUserId: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  displayName: string | null;
}

@Injectable()
export class AuthService {
  readonly configService: ConfigService;
  private readonly accessSecret: string;
  private readonly refreshSecret: string;
  private readonly accessExpiresIn: string;
  private readonly refreshExpiresIn: string;
  private readonly emailVerificationExpiresIn: string;
  private readonly passwordResetExpiresIn: string;
  private readonly refreshCookieName: string;
  private readonly appUrl: string;
  private readonly apiPublicUrl: string;
  private defaultPlayerLocationPromise: Promise<{ countryId: string; id: string } | null> | null = null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly emailService: EmailService,
    configService: ConfigService
  ) {
    this.configService = configService;
    this.accessSecret = configService.get<string>("JWT_ACCESS_SECRET", "dev-access-secret");
    this.refreshSecret = configService.get<string>("JWT_REFRESH_SECRET", "dev-refresh-secret");
    this.accessExpiresIn = configService.get<string>("JWT_ACCESS_EXPIRES_IN", "15m");
    this.refreshExpiresIn = configService.get<string>("JWT_REFRESH_EXPIRES_IN", "30d");
    this.emailVerificationExpiresIn = configService.get<string>("EMAIL_VERIFICATION_EXPIRES_IN", "1d");
    this.passwordResetExpiresIn = configService.get<string>("PASSWORD_RESET_EXPIRES_IN", "1h");
    this.refreshCookieName = getRefreshCookieName(configService);
    this.appUrl = configService.get<string>("APP_URL", "http://localhost:3000");
    this.apiPublicUrl = configService.get<string>("API_PUBLIC_URL", "http://localhost:4000/api");
  }

  async signIn(identifier: string, password: string): Promise<IssuedAuthSessionDto> {
    const user = await this.validateUser(identifier, password);

    if (!user.isVerified) {
      throw new ForbiddenException("Подтвердите email, чтобы войти");
    }

    return this.issueSession(user);
  }

  async signUp(dto: SignUpDto): Promise<IssuedAuthSessionDto> {
    if (dto.role && dto.role !== Role.PLAYER && dto.role !== Role.ORGANIZER) {
      throw new BadRequestException("Signup is available only for players and organizers.");
    }

    const targetRole = dto.role === Role.ORGANIZER ? Role.ORGANIZER : Role.PLAYER;
    const normalizedPhone = this.normalizePhone(dto.phone);
    if (!normalizedPhone) {
      throw new BadRequestException("Введите номер телефона");
    }

    const existingUser = await this.prisma.user.findUnique({ where: { phone: normalizedPhone } });
    if (existingUser) {
      throw new ConflictException("Такой номер уже зарегистрирован");
    }

    const city = await this.prisma.city.findUnique({
      where: { id: dto.cityId },
      select: {
        id: true,
        countryId: true
      }
    });

    if (!city) {
      throw new BadRequestException("Выберите корректный город");
    }

    const passwordHash = await hashPassword(dto.password);
    const user = await this.prisma.$transaction(async (tx) => {
      const createdUser = await tx.user.create({
        data: {
          email: this.buildPhoneEmail(normalizedPhone),
          phone: normalizedPhone,
          passwordHash,
          role: targetRole,
          isVerified: true
        }
      });

      if (targetRole === Role.PLAYER) {
        // Signup creates a zero-state player profile; external statistics remain an explicit follow-up step.
        await tx.player.create({
          data: {
            userId: createdUser.id,
            fullName: this.buildPlayerFullName(dto.firstName!, dto.lastName!),
            countryId: city.countryId,
            cityId: city.id,
            clubId: null,
            elo: 0,
            wins: 0,
            losses: 0,
            achievements: []
          }
        });
      }

      return createdUser;
    });

    return this.issueSession(user);
  }

  async verifyEmail(token: string): Promise<IssuedAuthSessionDto> {
    const user = await this.consumeAuthToken(token, AuthTokenType.EMAIL_VERIFICATION);

    await this.prisma.user.update({
      where: { id: user.id },
      data: { isVerified: true }
    });

    return this.issueSession({
      ...user,
      isVerified: true
    });
  }

  async resendVerification(email: string): Promise<AuthActionResultDto> {
    const user = await this.prisma.user.findUnique({ where: { email } });

    if (!user || user.isVerified) {
      return {
        success: true,
        message: "Если аккаунт существует, письмо уже отправлено"
      };
    }

    await this.prisma.authToken.updateMany({
      where: {
        userId: user.id,
        type: AuthTokenType.EMAIL_VERIFICATION,
        consumedAt: null
      },
      data: {
        consumedAt: new Date()
      }
    });

    const verificationToken = await this.issueAuthToken(user.id, AuthTokenType.EMAIL_VERIFICATION, this.emailVerificationExpiresIn);
    await this.emailService.sendVerificationEmail(user.email, verificationToken);

    return {
      success: true,
      message: "Письмо с подтверждением отправлено"
    };
  }

  async forgotPassword(email: string): Promise<AuthActionResultDto> {
    const user = await this.prisma.user.findUnique({ where: { email } });

    if (!user) {
      return {
        success: true,
        message: "Если аккаунт существует, письмо для сброса уже отправлено"
      };
    }

    await this.prisma.authToken.updateMany({
      where: {
        userId: user.id,
        type: AuthTokenType.PASSWORD_RESET,
        consumedAt: null
      },
      data: {
        consumedAt: new Date()
      }
    });

    const resetToken = await this.issueAuthToken(user.id, AuthTokenType.PASSWORD_RESET, this.passwordResetExpiresIn);
    await this.emailService.sendPasswordResetEmail(user.email, resetToken);

    return {
      success: true,
      message: "Письмо для сброса пароля отправлено"
    };
  }

  async resetPassword(token: string, password: string) {
    const user = await this.consumeAuthToken(token, AuthTokenType.PASSWORD_RESET);
    const passwordHash = await hashPassword(password);

    await this.prisma.user.update({
      where: { id: user.id },
      data: { passwordHash }
    });

    await this.revokeAllRefreshTokens(user.id);
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<IssuedAuthSessionDto> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      throw new UnauthorizedException("Пользователь не найден");
    }

    const matches = await verifyPassword(currentPassword, user.passwordHash);
    if (!matches) {
      throw new UnauthorizedException("Текущий пароль указан неверно");
    }

    const passwordHash = await hashPassword(newPassword);

    await this.prisma.user.update({
      where: { id: user.id },
      data: { passwordHash }
    });

    await this.revokeAllRefreshTokens(user.id);

    return this.issueSession({
      ...user,
      passwordHash
    });
  }

  async refresh(requestUser: RequestUser, cookieHeader: string | undefined): Promise<IssuedAuthSessionDto> {
    if (!requestUser.jti) {
      throw new UnauthorizedException("Refresh token обязателен");
    }

    const refreshToken = readCookieValue(cookieHeader, this.refreshCookieName);
    if (!refreshToken) {
      throw new UnauthorizedException("Refresh token обязателен");
    }

    const storedToken = await this.prisma.refreshToken.findUnique({
      where: { id: requestUser.jti },
      include: { user: true }
    });

    const validStoredToken = this.validateStoredRefreshToken(storedToken, refreshToken, requestUser.sub);
    const nextSession = await this.issueSession(validStoredToken.user, requestUser.capabilities);

    await this.prisma.refreshToken.update({
      where: { id: validStoredToken.id },
      data: {
        revokedAt: new Date(),
        replacedByTokenId: this.decodeRefreshTokenId(nextSession.refreshToken)
      }
    });

    return nextSession;
  }

  async logout(requestUser: RequestUser, cookieHeader: string | undefined) {
    if (!requestUser.jti) {
      throw new UnauthorizedException("Refresh token обязателен");
    }

    const refreshToken = readCookieValue(cookieHeader, this.refreshCookieName);
    if (!refreshToken) {
      return { success: true };
    }

    const storedToken = await this.prisma.refreshToken.findUnique({
      where: { id: requestUser.jti }
    });

    if (storedToken && !storedToken.revokedAt && verifyTokenHash(refreshToken, storedToken.tokenHash)) {
      await this.prisma.refreshToken.update({
        where: { id: storedToken.id },
        data: { revokedAt: new Date() }
      });
    }

    return { success: true };
  }

  async me(userId: string, requestUser: RequestUser): Promise<SessionUserDto> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      throw new UnauthorizedException("Пользователь не найден");
    }

    return this.serializeUser(user, requestUser.capabilities);
  }

  getOAuthAuthorizationUrl(providerInput: string, nextPath?: string): OAuthStartResult {
    const provider = this.assertOAuthProvider(providerInput);
    this.ensureOAuthProviderEnabled(provider);

    const state = randomBytes(24).toString("hex");
    const safeNextPath = this.sanitizeNextPath(nextPath);
    const redirectUri = this.buildOAuthCallbackUrl(provider);
    const authorizationUrl = this.buildProviderAuthorizationUrl(provider, redirectUri, state);

    return {
      authorizationUrl,
      state,
      nextPath: safeNextPath
    };
  }

  async completeOAuthSignIn(providerInput: string, input: OAuthCompletionInput): Promise<OAuthCompletionResult> {
    const provider = this.assertOAuthProvider(providerInput);
    this.ensureOAuthProviderEnabled(provider);

    const statePayload = this.parseOAuthStatePayload(input.storedStatePayload);
    if (!input.state || input.state !== statePayload.state) {
      throw new UnauthorizedException("Сессия входа устарела. Попробуйте ещё раз");
    }

    if (!input.code) {
      throw new UnauthorizedException("Не удалось завершить вход через выбранный сервис");
    }

    const profile = await this.loadOAuthProfile(provider, input.code, input.userPayload);
    const user = await this.findOrCreateOAuthUser(provider, profile);
    const capabilities = getAuthCapabilities(this.configService, user, { authProvider: provider });

    return {
      session: await this.issueSession(user, capabilities),
      nextPath: statePayload.nextPath
    };
  }

  buildOAuthSuccessRedirectUrl(nextPath?: string) {
    return new URL(this.sanitizeNextPath(nextPath), this.appUrl).toString();
  }

  buildOAuthErrorRedirectUrl(message: string, nextPath?: string) {
    const redirectUrl = new URL("/auth/signin", this.appUrl);
    redirectUrl.searchParams.set("error", message);

    const safeNextPath = this.sanitizeNextPath(nextPath);
    if (safeNextPath !== "/") {
      redirectUrl.searchParams.set("next", safeNextPath);
    }

    return redirectUrl.toString();
  }

  toPublicSession(session: IssuedAuthSessionDto): PublicAuthSessionDto {
    return {
      accessToken: session.accessToken,
      user: session.user
    };
  }

  private async validateUser(identifier: string, password: string) {
    const normalizedPhone = this.normalizePhone(identifier);
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [{ email: identifier.trim() }, normalizedPhone ? { phone: normalizedPhone } : { id: "" }]
      }
    });

    if (!user) {
      throw new UnauthorizedException("Неверный телефон, email или пароль");
    }

    const ok = await verifyPassword(password, user.passwordHash);
    if (!ok) {
      throw new UnauthorizedException("Неверный телефон, email или пароль");
    }

    return user;
  }

  private async issueSession(
    user: User,
    capabilities: AuthCapability[] = getAuthCapabilities(this.configService, user)
  ): Promise<IssuedAuthSessionDto> {
    const refreshTokenId = randomUUID();
    const accessToken = await this.jwtService.signAsync(
      {
        sub: user.id,
        email: user.email,
        role: user.role,
        capabilities,
        type: "access"
      },
      {
        secret: this.accessSecret,
        expiresIn: this.accessExpiresIn as never
      }
    );

    const refreshToken = await this.jwtService.signAsync(
      {
        sub: user.id,
        email: user.email,
        role: user.role,
        capabilities,
        type: "refresh"
      },
      {
        secret: this.refreshSecret,
        expiresIn: this.refreshExpiresIn as never,
        jwtid: refreshTokenId
      }
    );

    await this.prisma.refreshToken.create({
      data: {
        id: refreshTokenId,
        userId: user.id,
        tokenHash: hashToken(refreshToken),
        expiresAt: new Date(Date.now() + durationToMs(this.refreshExpiresIn))
      }
    });

    return {
      accessToken,
      refreshToken,
      user: this.serializeUser(user, capabilities)
    };
  }

  private async issueAuthToken(userId: string, type: AuthTokenType, expiresIn: string): Promise<string> {
    const token = randomBytes(32).toString("hex");

    await this.prisma.authToken.create({
      data: {
        userId,
        type,
        tokenHash: hashToken(token),
        expiresAt: new Date(Date.now() + durationToMs(expiresIn))
      }
    });

    return token;
  }

  private async consumeAuthToken(token: string, type: AuthTokenType): Promise<User> {
    const hashedToken = hashToken(token);
    const storedToken = await this.prisma.authToken.findUnique({
      where: { tokenHash: hashedToken },
      include: { user: true }
    });

    if (!storedToken || storedToken.type !== type || storedToken.consumedAt || storedToken.expiresAt.getTime() <= Date.now()) {
      throw new UnauthorizedException("Ссылка недействительна или уже истекла");
    }

    await this.prisma.authToken.update({
      where: { id: storedToken.id },
      data: { consumedAt: new Date() }
    });

    return storedToken.user;
  }

  private validateStoredRefreshToken(
    storedToken: (RefreshToken & { user: User }) | null,
    refreshToken: string,
    userId: string
  ): RefreshToken & { user: User } {
    if (!storedToken || storedToken.userId !== userId) {
      throw new UnauthorizedException("Refresh token недействителен");
    }

    if (storedToken.revokedAt || storedToken.expiresAt.getTime() <= Date.now()) {
      throw new UnauthorizedException("Refresh token больше не активен");
    }

    if (!verifyTokenHash(refreshToken, storedToken.tokenHash)) {
      throw new UnauthorizedException("Refresh token недействителен");
    }

    return storedToken;
  }

  private async revokeAllRefreshTokens(userId: string) {
    await this.prisma.refreshToken.updateMany({
      where: {
        userId,
        revokedAt: null
      },
      data: {
        revokedAt: new Date()
      }
    });
  }

  private decodeRefreshTokenId(refreshToken: string): string | null {
    const payload = this.jwtService.decode(refreshToken);
    if (!payload || typeof payload !== "object" || typeof payload.jti !== "string") {
      return null;
    }

    return payload.jti;
  }

  private serializeUser(
    user: User,
    capabilities: AuthCapability[] = getAuthCapabilities(this.configService, user)
  ): SessionUserDto {
    return {
      id: user.id,
      email: user.email,
      phone: user.phone ?? null,
      role: user.role,
      capabilities,
      isVerified: user.isVerified,
      createdAt: user.createdAt
    };
  }

  private normalizePhone(phone: string) {
    const trimmedPhone = phone.trim();
    if (!trimmedPhone) {
      return "";
    }

    const hasPlus = trimmedPhone.startsWith("+");
    const digits = trimmedPhone.replace(/\D/g, "");

    return digits ? `${hasPlus ? "+" : ""}${digits}` : "";
  }

  private buildPhoneEmail(phone: string) {
    const safePhone = phone.replace(/[^0-9]+/g, "");
    return `player-${safePhone}@phone.billard.local`;
  }

  private buildPlayerFullName(firstName: string, lastName: string) {
    const fullName = [firstName.trim(), lastName.trim()].filter(Boolean).join(" ").replace(/\s+/g, " ").trim();

    if (!fullName) {
      throw new BadRequestException("Введите имя и фамилию");
    }

    return fullName;
  }

  private assertOAuthProvider(provider: string): OAuthProvider {
    if (provider === "google" || provider === "apple" || provider === "facebook") {
      return provider;
    }

    throw new BadRequestException("Неизвестный способ входа");
  }

  private ensureOAuthProviderEnabled(provider: OAuthProvider) {
    const missingConfig =
      provider === "google"
        ? !this.getConfigValue("GOOGLE_OAUTH_CLIENT_ID") || !this.getConfigValue("GOOGLE_OAUTH_CLIENT_SECRET")
        : provider === "facebook"
          ? !this.getConfigValue("FACEBOOK_OAUTH_CLIENT_ID") || !this.getConfigValue("FACEBOOK_OAUTH_CLIENT_SECRET")
          : !this.getConfigValue("APPLE_OAUTH_CLIENT_ID") ||
            !this.getConfigValue("APPLE_OAUTH_TEAM_ID") ||
            !this.getConfigValue("APPLE_OAUTH_KEY_ID") ||
            !this.getConfigValue("APPLE_OAUTH_PRIVATE_KEY");

    if (missingConfig) {
      throw new BadRequestException(`Вход через ${this.providerLabel(provider)} временно недоступен`);
    }
  }

  private parseOAuthStatePayload(payload: string | null | undefined) {
    if (!payload) {
      throw new UnauthorizedException("Сессия входа устарела. Попробуйте ещё раз");
    }

    try {
      const parsed = JSON.parse(payload) as { state?: string; nextPath?: string };
      if (!parsed.state || typeof parsed.state !== "string") {
        throw new Error("invalid state");
      }

      return {
        state: parsed.state,
        nextPath: this.sanitizeNextPath(parsed.nextPath)
      };
    } catch {
      throw new UnauthorizedException("Сессия входа устарела. Попробуйте ещё раз");
    }
  }

  private sanitizeNextPath(nextPath?: string | null) {
    if (!nextPath || !nextPath.startsWith("/") || nextPath.startsWith("//")) {
      return "/";
    }

    return nextPath;
  }

  private buildOAuthCallbackUrl(provider: OAuthProvider) {
    return `${this.apiPublicUrl.replace(/\/$/, "")}/auth/oauth/${provider}/callback`;
  }

  private buildProviderAuthorizationUrl(provider: OAuthProvider, redirectUri: string, state: string) {
    const query = new URLSearchParams();

    if (provider === "google") {
      query.set("client_id", this.getConfigValue("GOOGLE_OAUTH_CLIENT_ID"));
      query.set("redirect_uri", redirectUri);
      query.set("response_type", "code");
      query.set("scope", "openid email profile");
      query.set("prompt", "select_account");
      query.set("state", state);
      return `https://accounts.google.com/o/oauth2/v2/auth?${query.toString()}`;
    }

    if (provider === "facebook") {
      query.set("client_id", this.getConfigValue("FACEBOOK_OAUTH_CLIENT_ID"));
      query.set("redirect_uri", redirectUri);
      query.set("response_type", "code");
      query.set("scope", "email,public_profile");
      query.set("state", state);
      return `https://www.facebook.com/v19.0/dialog/oauth?${query.toString()}`;
    }

    query.set("client_id", this.getConfigValue("APPLE_OAUTH_CLIENT_ID"));
    query.set("redirect_uri", redirectUri);
    query.set("response_type", "code");
    query.set("response_mode", "query");
    query.set("scope", "name email");
    query.set("state", state);
    return `https://appleid.apple.com/auth/authorize?${query.toString()}`;
  }

  private async loadOAuthProfile(provider: OAuthProvider, code: string, userPayload?: unknown): Promise<OAuthProfile> {
    if (provider === "google") {
      return this.loadGoogleProfile(code);
    }

    if (provider === "facebook") {
      return this.loadFacebookProfile(code);
    }

    return this.loadAppleProfile(code, userPayload);
  }

  private async loadGoogleProfile(code: string): Promise<OAuthProfile> {
    const tokenResponse = await this.requestJson<{
      access_token: string;
    }>("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: new URLSearchParams({
        code,
        client_id: this.getConfigValue("GOOGLE_OAUTH_CLIENT_ID"),
        client_secret: this.getConfigValue("GOOGLE_OAUTH_CLIENT_SECRET"),
        redirect_uri: this.buildOAuthCallbackUrl("google"),
        grant_type: "authorization_code"
      })
    }, "google");

    const profile = await this.requestJson<{
      sub: string;
      email?: string;
      given_name?: string;
      family_name?: string;
      name?: string;
    }>("https://openidconnect.googleapis.com/v1/userinfo", {
      headers: {
        Authorization: `Bearer ${tokenResponse.access_token}`
      }
    }, "google");

    return {
      providerUserId: profile.sub,
      email: profile.email?.trim().toLowerCase() ?? null,
      firstName: profile.given_name ?? null,
      lastName: profile.family_name ?? null,
      displayName: profile.name ?? null
    };
  }

  private async loadFacebookProfile(code: string): Promise<OAuthProfile> {
    const tokenResponse = await this.requestJson<{
      access_token: string;
    }>("https://graph.facebook.com/v19.0/oauth/access_token?" + new URLSearchParams({
      client_id: this.getConfigValue("FACEBOOK_OAUTH_CLIENT_ID"),
      client_secret: this.getConfigValue("FACEBOOK_OAUTH_CLIENT_SECRET"),
      redirect_uri: this.buildOAuthCallbackUrl("facebook"),
      code
    }).toString(), {}, "facebook");

    const profile = await this.requestJson<{
      id: string;
      email?: string;
      name?: string;
    }>("https://graph.facebook.com/me?" + new URLSearchParams({
      fields: "id,name,email",
      access_token: tokenResponse.access_token
    }).toString(), {}, "facebook");

    return {
      providerUserId: profile.id,
      email: profile.email?.trim().toLowerCase() ?? null,
      firstName: profile.name ?? null,
      lastName: null,
      displayName: profile.name ?? null
    };
  }

  private async loadAppleProfile(code: string, userPayload?: unknown): Promise<OAuthProfile> {
    const tokenResponse = await this.requestJson<{
      id_token: string;
    }>("https://appleid.apple.com/auth/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        client_id: this.getConfigValue("APPLE_OAUTH_CLIENT_ID"),
        client_secret: await this.createAppleClientSecret(),
        redirect_uri: this.buildOAuthCallbackUrl("apple")
      })
    }, "apple");

    const idTokenPayload = this.decodeJwtPayload(tokenResponse.id_token) as {
      sub?: string;
      email?: string;
    };
    const appleUser = this.parseAppleUserPayload(userPayload);

    return {
      providerUserId: idTokenPayload.sub ?? "",
      email: idTokenPayload.email?.trim().toLowerCase() ?? null,
      firstName: appleUser?.name?.firstName ?? null,
      lastName: appleUser?.name?.lastName ?? null,
      displayName:
        [appleUser?.name?.firstName, appleUser?.name?.lastName].filter(Boolean).join(" ").trim() || null
    };
  }

  private async createAppleClientSecret() {
    const privateKey = this.getConfigValue("APPLE_OAUTH_PRIVATE_KEY").replace(/\\n/g, "\n");

    return this.jwtService.signAsync(
      {},
      {
        algorithm: "ES256" as never,
        secret: privateKey,
        issuer: this.getConfigValue("APPLE_OAUTH_TEAM_ID"),
        audience: "https://appleid.apple.com",
        subject: this.getConfigValue("APPLE_OAUTH_CLIENT_ID"),
        expiresIn: "5m" as never,
        header: {
          alg: "ES256",
          kid: this.getConfigValue("APPLE_OAUTH_KEY_ID")
        }
      }
    );
  }

  private decodeJwtPayload(token: string) {
    const [, payload] = token.split(".");
    if (!payload) {
      throw new UnauthorizedException("Не удалось завершить вход через Apple");
    }

    return JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
  }

  private parseAppleUserPayload(userPayload?: unknown) {
    if (!userPayload) {
      return null;
    }

    if (typeof userPayload === "object") {
      return userPayload as { name?: { firstName?: string; lastName?: string } };
    }

    if (typeof userPayload === "string") {
      try {
        return JSON.parse(userPayload) as { name?: { firstName?: string; lastName?: string } };
      } catch {
        return null;
      }
    }

    return null;
  }

  private async findOrCreateOAuthUser(provider: OAuthProvider, profile: OAuthProfile) {
    if (!profile.providerUserId) {
      throw new UnauthorizedException(`Не удалось получить данные пользователя ${this.providerLabel(provider)}`);
    }

    const fallbackEmail = this.buildOAuthEmail(provider, profile.providerUserId);
    const email = profile.email ?? fallbackEmail;

    let user = await this.prisma.user.findFirst({
      where: {
        OR: [{ email }, { email: fallbackEmail }]
      }
    });

    if (!user) {
      user = await this.prisma.$transaction(async (tx) => {
        const createdUser = await tx.user.create({
          data: {
            email,
            phone: null,
            passwordHash: await hashPassword(randomBytes(32).toString("hex")),
            role: Role.PLAYER,
            isVerified: true
          }
        });

        await this.ensurePlayerProfile(createdUser, profile, tx);
        return createdUser;
      });
      return user;
    }

    if ((!user.isVerified || user.email !== email) && email !== fallbackEmail) {
      const emailOwner = await this.prisma.user.findUnique({ where: { email } });

      if (!emailOwner || emailOwner.id === user.id) {
        user = await this.prisma.user.update({
          where: { id: user.id },
          data: {
            email,
            isVerified: true
          }
        });
      }
    } else if (!user.isVerified) {
      user = await this.prisma.user.update({
        where: { id: user.id },
        data: { isVerified: true }
      });
    }

    await this.ensurePlayerProfile(user, profile);

    return user;
  }

  private async ensurePlayerProfile(
    user: User,
    profile: OAuthProfile,
    tx: Pick<PrismaService, "player" | "city"> = this.prisma
  ) {
    if (user.role !== Role.PLAYER) {
      return;
    }

    const existingProfile = await tx.player.findUnique({
      where: { userId: user.id },
      select: { id: true }
    });

    if (existingProfile) {
      return;
    }

    const location = await this.getDefaultPlayerLocation(tx);
    if (!location) {
      throw new UnauthorizedException("Не удалось завершить вход через выбранный сервис");
    }

    await tx.player.create({
      data: {
        userId: user.id,
        fullName: this.buildOAuthPlayerName(profile),
        countryId: location.countryId,
        cityId: location.id,
        clubId: null,
        elo: 0,
        wins: 0,
        losses: 0,
        achievements: []
      }
    });
  }

  private buildOAuthPlayerName(profile: OAuthProfile) {
    const parts = [profile.firstName?.trim(), profile.lastName?.trim()].filter(Boolean);
    const fullName = parts.join(" ").trim() || profile.displayName?.trim() || "Player";
    return fullName.replace(/\s+/g, " ");
  }

  private async getDefaultPlayerLocation(tx: Pick<PrismaService, "city"> = this.prisma) {
    if (tx !== this.prisma) {
      return this.resolveDefaultPlayerLocation(tx);
    }

    if (!this.defaultPlayerLocationPromise) {
      this.defaultPlayerLocationPromise = this.resolveDefaultPlayerLocation(this.prisma);
    }

    return this.defaultPlayerLocationPromise;
  }

  private async resolveDefaultPlayerLocation(tx: Pick<PrismaService, "city">) {
    const preferredCity = await tx.city.findFirst({
      where: {
        name: "Tashkent",
        country: {
          code: "UZ"
        }
      },
      select: {
        id: true,
        countryId: true
      }
    });

    if (preferredCity) {
      return preferredCity;
    }

    return tx.city.findFirst({
      orderBy: [{ countryId: "asc" }, { name: "asc" }],
      select: {
        id: true,
        countryId: true
      }
    });
  }

  private buildOAuthEmail(provider: OAuthProvider, providerUserId: string) {
    const safeId = providerUserId.replace(/[^a-zA-Z0-9_-]+/g, "");
    return `${provider}-${safeId}@oauth.billard.local`;
  }

  private providerLabel(provider: OAuthProvider) {
    switch (provider) {
      case "google":
        return "Google";
      case "apple":
        return "Apple";
      default:
        return "Facebook";
    }
  }

  private getConfigValue(name: string) {
    return this.configService.get<string>(name, "").trim();
  }

  private async requestJson<T>(
    url: string,
    init: NonNullable<Parameters<typeof fetch>[1]>,
    provider: OAuthProvider
  ): Promise<T> {
    const response = await fetch(url, {
      ...init,
      headers: {
        Accept: "application/json",
        ...(init.headers ?? {})
      }
    });

    const raw = await response.text();
    const payload = raw ? this.safeParseJson(raw) : null;

    if (!response.ok || !payload) {
      throw new UnauthorizedException(`Не удалось завершить вход через ${this.providerLabel(provider)}`);
    }

    return payload as T;
  }

  private safeParseJson(value: string) {
    try {
      return JSON.parse(value);
    } catch {
      return null;
    }
  }
}
