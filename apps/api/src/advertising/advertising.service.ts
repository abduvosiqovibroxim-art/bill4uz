import { Injectable, Logger } from "@nestjs/common";
import { Role } from "@prisma/client";
import { PrismaService } from "../common/prisma.service";
import { EmailService } from "../email/email.service";
import { NotificationsService } from "../notifications/notifications.service";
import { CreateAdvertisingRequestDto } from "./dto";

@Injectable()
export class AdvertisingService {
  private readonly logger = new Logger(AdvertisingService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
    private readonly notificationsService: NotificationsService
  ) {}

  async create(dto: CreateAdvertisingRequestDto) {
    const request = await this.prisma.advertisingRequest.create({
      data: {
        name: dto.name.trim(),
        contact: dto.contact.trim(),
        company: dto.company?.trim() || null,
        budget: dto.budget?.trim() || null,
        message: dto.message.trim()
      }
    });

    await this.notifyAdmins(request);

    return { id: request.id, status: request.status, createdAt: request.createdAt };
  }

  private async notifyAdmins(request: {
    id: string;
    name: string;
    contact: string;
    company: string | null;
    budget: string | null;
    message: string;
  }) {
    const summary = [
      `Заявка на размещение рекламы от ${request.name}`,
      request.company ? `Компания: ${request.company}` : null,
      `Контакт: ${request.contact}`,
      request.budget ? `Бюджет: ${request.budget}` : null
    ]
      .filter(Boolean)
      .join(" · ");

    const admins = await this.prisma.user.findMany({
      where: { role: Role.ADMIN },
      select: { id: true, email: true }
    });

    await Promise.all(
      admins.map((admin) =>
        this.notificationsService
          .create(admin.id, summary, { eventKey: `advertising-request:${request.id}` })
          .catch((error) => {
            this.logger.warn(`Failed to notify admin ${admin.id} about advertising request: ${String(error)}`);
          })
      )
    );

    const emailBody = [
      "Новая заявка на размещение рекламы.",
      "",
      `Имя: ${request.name}`,
      `Контакт: ${request.contact}`,
      request.company ? `Компания: ${request.company}` : null,
      request.budget ? `Бюджет: ${request.budget}` : null,
      "",
      "Сообщение:",
      request.message
    ]
      .filter((line) => line !== null)
      .join("\n");

    const recipients = admins.map((admin) => admin.email).filter(Boolean);
    if (recipients.length > 0) {
      await this.emailService
        .sendAdvertisingRequestEmail(recipients.join(", "), emailBody)
        .catch((error) => {
          this.logger.warn(`Failed to email admins about advertising request: ${String(error)}`);
        });
    }
  }
}
