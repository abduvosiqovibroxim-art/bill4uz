import { Body, Controller, Get, Param, Post, Query, Req, Res, UseGuards } from "@nestjs/common";
import { Request, Response } from "express";
import {
  clearCapabilitiesCookie,
  clearOAuthStateCookie,
  clearRoleCookie,
  clearRefreshTokenCookie,
  getOAuthStateCookieName,
  setCapabilitiesCookie,
  setOAuthStateCookie,
  setRoleCookie,
  setRefreshTokenCookie
} from "./cookie";
import { AuthService } from "./auth.service";
import {
  ChangePasswordDto,
  ForgotPasswordDto,
  IssuedAuthSessionDto,
  RequestUser,
  ResendVerificationDto,
  ResetPasswordDto,
  SignInDto,
  SignUpDto,
  VerifyEmailDto
} from "./dto";
import { JwtAccessGuard } from "./jwt-access.guard";
import { JwtRefreshGuard } from "./jwt-refresh.guard";
import { readCookieValue } from "../common/cookies";
import { RateLimit } from "../platform/rate-limit.decorator";
import { RateLimitGuard } from "../platform/rate-limit.guard";

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get("oauth/:provider/start")
  startOAuth(
    @Param("provider") provider: string,
    @Query("next") next: string | undefined,
    @Res() response: Response
  ) {
    try {
      const { authorizationUrl, state, nextPath } = this.authService.getOAuthAuthorizationUrl(provider, next);
      setOAuthStateCookie(
        response,
        this.authService.configService,
        provider,
        JSON.stringify({ state, nextPath })
      );
      return response.redirect(authorizationUrl);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Не удалось начать вход";
      return response.redirect(this.authService.buildOAuthErrorRedirectUrl(message, next));
    }
  }

  @Get("oauth/:provider/callback")
  async oauthCallbackGet(
    @Param("provider") provider: string,
    @Query("code") code: string | undefined,
    @Query("state") state: string | undefined,
    @Query("error") error: string | undefined,
    @Req() request: Request,
    @Res() response: Response
  ) {
    return this.finishOAuth(provider, { code, state, error }, request, response);
  }

  @Post("oauth/:provider/callback")
  async oauthCallbackPost(
    @Param("provider") provider: string,
    @Body("code") code: string | undefined,
    @Body("state") state: string | undefined,
    @Body("error") error: string | undefined,
    @Body("user") userPayload: unknown,
    @Req() request: Request,
    @Res() response: Response
  ) {
    return this.finishOAuth(provider, { code, state, error, userPayload }, request, response);
  }

  @UseGuards(RateLimitGuard)
  @Post("signin")
  @RateLimit({ bucket: "auth-signin", limit: 10, windowMs: 60_000 })
  async signIn(@Body() dto: SignInDto, @Res({ passthrough: true }) response: Response) {
    const session = await this.authService.signIn(dto.identifier, dto.password);
    this.setSessionCookies(response, session);
    return this.authService.toPublicSession(session);
  }

  @UseGuards(RateLimitGuard)
  @Post("signup")
  @RateLimit({ bucket: "auth-signup", limit: 10, windowMs: 60_000 })
  async signUp(@Body() dto: SignUpDto, @Res({ passthrough: true }) response: Response) {
    const session = await this.authService.signUp(dto);
    this.setSessionCookies(response, session);
    return this.authService.toPublicSession(session);
  }

  @Post("verify-email")
  async verifyEmail(@Body() dto: VerifyEmailDto, @Res({ passthrough: true }) response: Response) {
    const session = await this.authService.verifyEmail(dto.token);
    this.setSessionCookies(response, session);
    return this.authService.toPublicSession(session);
  }

  @UseGuards(RateLimitGuard)
  @Post("resend-verification")
  @RateLimit({ bucket: "auth-resend-verification", limit: 5, windowMs: 60_000 })
  async resendVerification(@Body() dto: ResendVerificationDto) {
    return this.authService.resendVerification(dto.email);
  }

  @UseGuards(RateLimitGuard)
  @Post("forgot-password")
  @RateLimit({ bucket: "auth-forgot-password", limit: 5, windowMs: 60_000 })
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto.email);
  }

  @Post("reset-password")
  async resetPassword(@Body() dto: ResetPasswordDto, @Res({ passthrough: true }) response: Response) {
    await this.authService.resetPassword(dto.token, dto.password);
    clearRefreshTokenCookie(response, this.authService.configService);
    clearRoleCookie(response, this.authService.configService);
    clearCapabilitiesCookie(response, this.authService.configService);
    return { success: true };
  }

  @UseGuards(RateLimitGuard, JwtRefreshGuard)
  @Post("refresh")
  @RateLimit({ bucket: "auth-refresh", limit: 20, windowMs: 60_000 })
  async refresh(
    @Req() request: Request & { user: RequestUser },
    @Res({ passthrough: true }) response: Response
  ) {
    const session = await this.authService.refresh(request.user, request.headers.cookie);
    this.setSessionCookies(response, session);
    return this.authService.toPublicSession(session);
  }

  @UseGuards(JwtRefreshGuard)
  @Post("logout")
  async logout(
    @Req() request: Request & { user: RequestUser },
    @Res({ passthrough: true }) response: Response
  ) {
    clearRefreshTokenCookie(response, this.authService.configService);
    clearRoleCookie(response, this.authService.configService);
    clearCapabilitiesCookie(response, this.authService.configService);
    return this.authService.logout(request.user, request.headers.cookie);
  }

  @UseGuards(JwtAccessGuard)
  @Post("change-password")
  async changePassword(
    @Req() request: { user: RequestUser },
    @Body() dto: ChangePasswordDto,
    @Res({ passthrough: true }) response: Response
  ) {
    const session = await this.authService.changePassword(request.user.sub, dto.currentPassword, dto.newPassword);
    this.setSessionCookies(response, session);
    return this.authService.toPublicSession(session);
  }

  @UseGuards(JwtAccessGuard)
  @Get("me")
  async me(@Req() request: { user: RequestUser }) {
    return this.authService.me(request.user.sub, request.user);
  }

  private async finishOAuth(
    provider: string,
    input: { code?: string; state?: string; error?: string; userPayload?: unknown },
    request: Request,
    response: Response
  ) {
    const cookieName = getOAuthStateCookieName(provider);
    const storedStatePayload = readCookieValue(request.headers.cookie, cookieName);
    let nextPath = "/";

    try {
      if (storedStatePayload) {
        const parsed = JSON.parse(storedStatePayload) as { nextPath?: string };
        nextPath = typeof parsed.nextPath === "string" ? parsed.nextPath : "/";
      }
    } catch {
      nextPath = "/";
    }

    clearOAuthStateCookie(response, this.authService.configService, provider);

    if (input.error) {
      return response.redirect(this.authService.buildOAuthErrorRedirectUrl("Вход был отменен", nextPath));
    }

    try {
      const result = await this.authService.completeOAuthSignIn(provider, {
        code: input.code,
        state: input.state,
        storedStatePayload,
        userPayload: input.userPayload
      });

      this.setSessionCookies(response, result.session);
      return response.redirect(this.authService.buildOAuthSuccessRedirectUrl(result.nextPath));
    } catch (error) {
      const message = error instanceof Error ? error.message : "Не удалось завершить вход";
      return response.redirect(this.authService.buildOAuthErrorRedirectUrl(message, nextPath));
    }
  }

  private setSessionCookies(response: Response, session: IssuedAuthSessionDto) {
    setRefreshTokenCookie(response, this.authService.configService, session.refreshToken);
    setRoleCookie(response, this.authService.configService, session.user.role);
    setCapabilitiesCookie(response, this.authService.configService, session.user.capabilities);
  }
}
