import { Injectable } from "@nestjs/common";
import { ApplicationStatus, BookingStatus, BracketMatchStatus, TournamentStatus } from "@prisma/client";
import { PrismaService } from "../common/prisma.service";

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  forUser(userId: string) {
    return this.prisma.notification.findMany({ where: { userId }, orderBy: { createdAt: "desc" } });
  }

  async create(userId: string, message: string, options: { eventKey?: string } = {}) {
    if (options.eventKey) {
      return this.prisma.notification.upsert({
        where: { eventKey: options.eventKey },
        update: {},
        create: {
          userId,
          message,
          eventKey: options.eventKey
        }
      });
    }

    return this.prisma.notification.create({
      data: {
        userId,
        message
      }
    });
  }

  async markTelegramDelivered(id: string) {
    return this.prisma.notification.update({
      where: { id },
      data: {
        telegramDeliveredAt: new Date()
      }
    });
  }

  async getPendingTelegramNotifications(limit = 50) {
    // Deliver ALL undelivered notifications (results, disputes, completion, reminders, bookings)
    // to linked Telegram users — not just reminders. The recency window prevents a backlog
    // of old undelivered notifications from flooding users after this is enabled.
    const recencyWindow = new Date(Date.now() - 24 * 60 * 60 * 1000);
    return this.prisma.notification.findMany({
      where: {
        telegramDeliveredAt: null,
        createdAt: { gte: recencyWindow },
        user: {
          telegramId: {
            not: null
          }
        }
      },
      include: {
        user: {
          select: {
            telegramId: true,
            telegramUsername: true
          }
        }
      },
      orderBy: {
        createdAt: "asc"
      },
      take: limit
    });
  }

  async notifyApplicationSubmitted(applicationId: string) {
    const application = await this.prisma.application.findUnique({
      where: { id: applicationId },
      include: {
        player: {
          select: {
            fullName: true,
            userId: true
          }
        },
        tournament: {
          select: {
            id: true,
            title: true
          }
        }
      }
    });

    if (!application?.player.userId) {
      return;
    }

    await this.create(
      application.player.userId,
      `Заявка на турнир "${application.tournament.title}" отправлена.`,
      {
        eventKey: `application-submitted:${application.id}`
      }
    );
  }

  async notifyApplicationModerated(applicationId: string) {
    const application = await this.prisma.application.findUnique({
      where: { id: applicationId },
      include: {
        player: {
          select: {
            userId: true
          }
        },
        tournament: {
          select: {
            title: true
          }
        }
      }
    });

    if (!application?.player.userId) {
      return;
    }

    const statusLabel =
      application.status === ApplicationStatus.APPROVED ? "подтверждена" : application.status === ApplicationStatus.REJECTED ? "отклонена" : "обновлена";

    await this.create(
      application.player.userId,
      `Заявка на турнир "${application.tournament.title}" ${statusLabel}.`,
      {
        eventKey: `application-moderated:${application.id}:${application.status}`
      }
    );
  }

  async notifyMatchResult(matchId: string) {
    const match = await this.prisma.bracketMatch.findUnique({
      where: { id: matchId },
      include: {
        tournament: {
          select: {
            id: true,
            title: true
          }
        },
        player1: {
          include: {
            player: {
              select: {
                fullName: true,
                userId: true
              }
            }
          }
        },
        player2: {
          include: {
            player: {
              select: {
                fullName: true,
                userId: true
              }
            }
          }
        },
        winner: {
          include: {
            player: {
              select: {
                fullName: true,
                userId: true
              }
            }
          }
        }
      }
    });

    if (!match?.winner?.player?.fullName) {
      return;
    }

    const message = `Матч турнира "${match.tournament.title}" завершён: ${match.player1?.player?.fullName ?? "-"} ${match.player1Score ?? 0}:${match.player2Score ?? 0} ${match.player2?.player?.fullName ?? "-"}.\nПобедитель: ${match.winner.player.fullName}.`;
    const recipients = new Set(
      [match.player1?.player?.userId, match.player2?.player?.userId].filter((value): value is string => Boolean(value))
    );

    for (const userId of recipients) {
      await this.create(userId, message, {
        eventKey: `match-result:${match.id}:${userId}`
      });
    }
  }

  async notifyDisputeFiled(disputeId: string) {
    const dispute = await this.prisma.matchDispute.findUnique({
      where: { id: disputeId },
      include: {
        match: {
          select: {
            matchNumber: true,
            tournament: { select: { title: true, organizerId: true } }
          }
        }
      }
    });

    const organizerId = dispute?.match.tournament.organizerId;
    if (!dispute || !organizerId) {
      return;
    }

    await this.create(
      organizerId,
      `Жалоба на результат матча №${dispute.match.matchNumber} турнира "${dispute.match.tournament.title}". Требуется проверка.`,
      { eventKey: `dispute-filed:${dispute.id}` }
    );
  }

  async notifyDisputeResolved(disputeId: string) {
    const dispute = await this.prisma.matchDispute.findUnique({
      where: { id: disputeId },
      include: {
        match: { select: { matchNumber: true, tournament: { select: { title: true } } } }
      }
    });

    if (!dispute) {
      return;
    }

    const label = dispute.status === "UPHELD" ? "удовлетворена" : "отклонена";
    const comment = dispute.resolution ? ` Комментарий: ${dispute.resolution}` : "";

    await this.create(
      dispute.filedByUserId,
      `Ваша жалоба по матчу №${dispute.match.matchNumber} турнира "${dispute.match.tournament.title}" ${label}.${comment}`,
      { eventKey: `dispute-resolved:${dispute.id}:${dispute.status}` }
    );
  }

  async notifyTournamentCompletion(tournamentId: string) {
    const tournament = await this.prisma.tournament.findUnique({
      where: { id: tournamentId },
      include: {
        applications: {
          where: {
            status: ApplicationStatus.APPROVED
          },
          include: {
            player: {
              select: {
                userId: true
              }
            }
          }
        },
        bracketMatches: {
          where: {
            status: BracketMatchStatus.FINISHED
          },
          include: {
            winner: {
              include: {
                player: {
                  select: {
                    userId: true,
                    fullName: true
                  }
                }
              }
            }
          },
          orderBy: [{ round: "desc" }, { matchNumber: "asc" }]
        }
      }
    });

    if (!tournament || tournament.status !== TournamentStatus.FINISHED) {
      return;
    }

    const finalMatch = tournament.bracketMatches[0] ?? null;
    const championUserId = finalMatch?.winner?.player?.userId ?? null;
    const recipients = new Set(
      tournament.applications
        .map((application) => application.player.userId)
        .filter((value): value is string => Boolean(value))
    );

    for (const userId of recipients) {
      await this.create(userId, `Турнир "${tournament.title}" завершён. Итоговая сетка и чемпион уже доступны.`, {
        eventKey: `tournament-finished:${tournament.id}:${userId}`
      });
    }

    if (championUserId) {
      await this.create(championUserId, `Вы стали чемпионом турнира "${tournament.title}".`, {
        eventKey: `tournament-champion:${tournament.id}:${championUserId}`
      });
    }
  }

  async sweepTelegramReminders() {
    const now = new Date();
    const reminderThreshold = new Date(now.getTime() + 2 * 60 * 60 * 1000);

    const upcomingApplications = await this.prisma.application.findMany({
      where: {
        status: ApplicationStatus.APPROVED,
        tournament: {
          status: {
            in: [TournamentStatus.REGISTRATION, TournamentStatus.LIVE]
          },
          startsAt: {
            gte: now,
            lte: reminderThreshold
          }
        }
      },
      include: {
        player: {
          select: {
            userId: true
          }
        },
        tournament: {
          select: {
            id: true,
            title: true,
            startsAt: true,
            club: {
              select: {
                name: true
              }
            },
            discipline: {
              select: {
                name: true
              }
            }
          }
        }
      }
    });

    for (const application of upcomingApplications) {
      if (!application.player.userId) {
        continue;
      }

      await this.create(
        application.player.userId,
        [
          "Сегодня турнир",
          application.tournament.title,
          `Клуб: ${application.tournament.club.name}`,
          `Время: ${formatTournamentReminderTime(application.tournament.startsAt)}`,
          `Дисциплина: ${application.tournament.discipline.name}`,
          "",
          "До начала осталось 2 часа"
        ].join("\n"),
        {
          eventKey: `tournament_reminder_2h:${application.tournament.id}:${application.player.userId}`
        }
      );
    }
  }

  async notifyBookingCreated(bookingId: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        club: {
          select: {
            name: true,
            userId: true
          }
        },
        table: {
          select: {
            name: true,
            kind: true
          }
        },
        user: {
          select: {
            id: true,
            phone: true
          }
        },
        player: {
          select: {
            fullName: true
          }
        }
      }
    });

    if (!booking) {
      return;
    }

    await this.create(
      booking.user.id,
      `Бронь подтверждена: "${booking.club.name}", ${booking.table.name}, ${formatBookingPeriod(booking.startAt, booking.endAt)}, сумма ${formatMoney(booking.priceMinor)}.`,
      {
        eventKey: `booking-created:${booking.id}:${booking.user.id}`
      }
    );

    if (booking.club.userId) {
      await this.create(
        booking.club.userId,
        [
          "Новая бронь",
          `Клиент: ${booking.player?.fullName ?? booking.user.phone ?? booking.user.id}`,
          `Стол: ${booking.table.name}${normalizeTableKind(booking.table.kind) === "VIP" ? " VIP" : ""}`,
          `Время: ${formatBookingPeriod(booking.startAt, booking.endAt)}`,
          `Сумма: ${formatMoney(booking.priceMinor)}`
        ].join("\n"),
        {
          eventKey: `booking-created-club:${booking.id}:${booking.club.userId}`
        }
      );
    }
  }

  async notifyBookingStatus(bookingId: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        club: {
          select: {
            name: true
          }
        },
        table: {
          select: {
            name: true
          }
        },
        user: {
          select: {
            id: true
          }
        }
      }
    });

    if (!booking) {
      return;
    }

    const statusLabel =
      booking.status === BookingStatus.CONFIRMED
        ? "подтверждена"
        : booking.status === BookingStatus.CANCELLED
          ? "отменена"
          : booking.status === BookingStatus.FINISHED || booking.status === BookingStatus.COMPLETED
            ? "завершена"
            : booking.status === BookingStatus.NO_SHOW
              ? "отмечена как no-show"
              : "обновлена";

    await this.create(
      booking.user.id,
      `Бронь в "${booking.club.name}" ${statusLabel}: ${booking.table.name}, ${booking.startAt.toISOString()}.`,
      {
        eventKey: `booking-status:${booking.id}:${booking.status}:${booking.user.id}`
      }
    );
  }
}

function normalizeTableKind(value?: string | null) {
  return (value ?? "").trim().toUpperCase() === "VIP" ? "VIP" : "REGULAR";
}

function formatTournamentReminderTime(value: Date) {
  return new Intl.DateTimeFormat("ru-RU", {
    timeZone: "Asia/Tashkent",
    hour: "2-digit",
    minute: "2-digit"
  }).format(value);
}

function formatBookingPeriod(startAt: Date, endAt: Date) {
  const formatter = new Intl.DateTimeFormat("ru-RU", {
    timeZone: "Asia/Tashkent",
    hour: "2-digit",
    minute: "2-digit"
  });

  return `${formatter.format(startAt)}-${formatter.format(endAt)}`;
}

function formatMoney(value?: number | null) {
  if (typeof value !== "number") {
    return "-";
  }

  return `${new Intl.NumberFormat("ru-RU").format(value)} сум`;
}
