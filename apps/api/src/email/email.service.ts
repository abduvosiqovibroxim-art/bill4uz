import { Injectable, Logger, OnModuleDestroy } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { mkdir, writeFile } from "fs/promises";
import * as nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";
import { join, resolve } from "path";

type EmailCategory = "verify-email" | "reset-password" | "advertising-request";

@Injectable()
export class EmailService implements OnModuleDestroy {
  private readonly logger = new Logger(EmailService.name);
  private readonly appUrl: string;
  private readonly deliveryMode: "smtp" | "file";
  private readonly from: string;
  private readonly outboxDir: string;
  private transporter: Transporter | null = null;

  constructor(private readonly configService: ConfigService) {
    this.appUrl = configService.get<string>("APP_URL", "http://localhost:3000");
    this.deliveryMode = configService.get<string>("EMAIL_DELIVERY_MODE", "file") === "smtp" ? "smtp" : "file";
    this.from = configService.get<string>("EMAIL_FROM", "Billard.uz <no-reply@billard.uz>");
    this.outboxDir = configService.get<string>("EMAIL_OUTBOX_DIR", "apps/api/.email-outbox");
  }

  async onModuleDestroy() {
    if (this.transporter) {
      await this.transporter.close();
    }
  }

  async sendVerificationEmail(email: string, token: string) {
    const actionUrl = this.buildAppUrl("/auth/verify-email", token);

    await this.sendMessage({
      category: "verify-email",
      to: email,
      subject: "Verify your Billard.uz account",
      text: [
        "Welcome to Billard.uz.",
        "",
        "Please verify your email address by opening the link below:",
        actionUrl,
        "",
        "If you did not create this account, you can ignore this email."
      ].join("\n"),
      html: [
        "<p>Welcome to <strong>Billard.uz</strong>.</p>",
        "<p>Please verify your email address by opening the link below:</p>",
        `<p><a href="${actionUrl}">${actionUrl}</a></p>`,
        "<p>If you did not create this account, you can ignore this email.</p>"
      ].join("")
    });
  }

  async sendPasswordResetEmail(email: string, token: string) {
    const actionUrl = this.buildAppUrl("/auth/reset-password", token);

    await this.sendMessage({
      category: "reset-password",
      to: email,
      subject: "Reset your Billard.uz password",
      text: [
        "We received a request to reset your Billard.uz password.",
        "",
        "Open the link below to set a new password:",
        actionUrl,
        "",
        "If you did not request this change, you can ignore this email."
      ].join("\n"),
      html: [
        "<p>We received a request to reset your <strong>Billard.uz</strong> password.</p>",
        "<p>Open the link below to set a new password:</p>",
        `<p><a href="${actionUrl}">${actionUrl}</a></p>`,
        "<p>If you did not request this change, you can ignore this email.</p>"
      ].join("")
    });
  }

  async sendAdvertisingRequestEmail(to: string, body: string) {
    await this.sendMessage({
      category: "advertising-request",
      to,
      subject: "Новая заявка на размещение рекламы — Billard.uz",
      text: body,
      html: `<pre style="font-family: inherit; white-space: pre-wrap;">${this.escapeHtml(body)}</pre>`
    });
  }

  private escapeHtml(value: string) {
    return value
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  private async sendMessage(input: {
    category: EmailCategory;
    to: string;
    subject: string;
    text: string;
    html: string;
  }) {
    try {
      const transporter = this.getTransporter();
      const info = await transporter.sendMail({
        from: this.from,
        to: input.to,
        subject: input.subject,
        text: input.text,
        html: input.html
      });

      if (this.deliveryMode === "file") {
        await this.writeOutboxMessage(input, info.message);
        return;
      }

      this.logger.log(`Email delivered via SMTP: ${input.category} -> ${input.to}`);
    } catch (error) {
      if (this.deliveryMode !== "smtp") {
        throw error;
      }

      this.logger.warn(
        `SMTP delivery failed for ${input.category} -> ${input.to}. Falling back to file outbox.`
      );
      this.logger.warn(error instanceof Error ? error.message : "Unknown SMTP error");

      const fallbackTransport = nodemailer.createTransport({
        streamTransport: true,
        buffer: true,
        newline: "unix"
      });
      const fallbackInfo = await fallbackTransport.sendMail({
        from: this.from,
        to: input.to,
        subject: input.subject,
        text: input.text,
        html: input.html
      });

      await this.writeOutboxMessage(input, fallbackInfo.message);
      await fallbackTransport.close();
    }
  }

  private getTransporter() {
    if (this.transporter) {
      return this.transporter;
    }

    if (this.deliveryMode === "smtp") {
      const host = this.configService.get<string>("SMTP_HOST", "").trim();
      const port = Number(this.configService.get<string>("SMTP_PORT", "587"));
      const secure = this.configService.get<string>("SMTP_SECURE", "false") === "true";
      const user = this.configService.get<string>("SMTP_USER", "").trim();
      const pass = this.configService.get<string>("SMTP_PASS", "").trim();

      if (!host) {
        throw new Error("SMTP_HOST is not configured");
      }

      this.transporter = nodemailer.createTransport({
        host,
        port,
        secure,
        auth: user && pass ? { user, pass } : undefined
      });

      return this.transporter;
    }

    this.transporter = nodemailer.createTransport({
      streamTransport: true,
      buffer: true,
      newline: "unix"
    });

    return this.transporter;
  }

  private buildAppUrl(pathname: string, token: string) {
    const url = new URL(pathname, this.ensureTrailingSlash(this.appUrl));
    url.searchParams.set("token", token);
    return url.toString();
  }

  private ensureTrailingSlash(value: string) {
    return value.endsWith("/") ? value : `${value}/`;
  }

  private async writeOutboxMessage(
    input: { category: EmailCategory; to: string; subject: string; text: string; html: string },
    message: unknown
  ) {
    const outboxDir = resolve(this.outboxDir);
    await mkdir(outboxDir, { recursive: true });

    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const basename = `${timestamp}-${input.category}-${this.sanitizeFilename(input.to)}`;
    const emlContent =
      Buffer.isBuffer(message) ? message.toString("utf8") : typeof message === "string" ? message : "";

    await writeFile(join(outboxDir, `${basename}.eml`), emlContent, "utf8");
    await writeFile(
      join(outboxDir, `${basename}.json`),
      JSON.stringify(
        {
          to: input.to,
          subject: input.subject,
          category: input.category,
          text: input.text,
          html: input.html
        },
        null,
        2
      ),
      "utf8"
    );

    this.logger.log(`Email written to outbox: ${join(outboxDir, `${basename}.json`)}`);
  }

  private sanitizeFilename(value: string) {
    return value.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  }
}
