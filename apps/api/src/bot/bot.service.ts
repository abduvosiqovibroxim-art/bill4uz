import { randomBytes } from "crypto";
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException
} from "@nestjs/common";
import {
  ApplicationStatus,
  ParticipantSelectionMode,
  Prisma,
  Role,
  TelegramGroupMatch,
  TelegramGroupMatchStatus,
  TournamentStatus,
  User
} from "@prisma/client";
import { ConfigService } from "@nestjs/config";
import { RequestUser } from "../auth/dto";
import { canAccessRole, getAuthCapabilities } from "../auth/special-access";
import { hashPassword } from "../common/password";
import { PrismaService } from "../common/prisma.service";
import { hashToken } from "../common/token";
import { ApplicationsService } from "../applications/applications.service";
import { NotificationsService } from "../notifications/notifications.service";
import { BracketMatchesService } from "../brackets/bracket-matches.service";
import {
  ConsumeTelegramLinkDto,
  CreateTelegramGroupMatchDto,
  LinkExistingTelegramPlayerDto,
  RegisterTelegramPlayerDto,
  SetTelegramLanguageDto,
  TelegramGroupMatchActionDto,
  TelegramGroupMatchPointDto,
  UpdateTelegramGroupMatchMessageDto
} from "./dto";

@Injectable()
export class BotService {
  private readonly botUsername: string;
  private readonly appUrl: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly applicationsService: ApplicationsService,
    private readonly notificationsService: NotificationsService,
    private readonly bracketMatchesService: BracketMatchesService
  ) {
    this.botUsername = this.configService.get<string>("TELEGRAM_BOT_USERNAME", "").replace(/^@/, "").trim();
    this.appUrl = this.configService.get<string>("APP_URL", "http://localhost:3000").replace(/\/$/, "");
  }

  async getLinkStatus(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        telegramId: true,
        telegramUsername: true,
        telegramLinkedAt: true
      }
    });

    if (!user) {
      throw new UnauthorizedException("User not found");
    }

    return {
      linked: Boolean(user.telegramId),
      telegramId: user.telegramId,
      telegramUsername: user.telegramUsername,
      telegramLinkedAt: user.telegramLinkedAt,
      botUsername: this.botUsername
    };
  }

  async createLinkRequest(userId: string) {
    await this.prisma.telegramLinkToken.updateMany({
      where: {
        userId,
        consumedAt: null
      },
      data: {
        consumedAt: new Date()
      }
    });

    const rawToken = randomBytes(24).toString("hex");
    const code = rawToken.slice(0, 8).toUpperCase();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    await this.prisma.telegramLinkToken.create({
      data: {
        userId,
        tokenHash: hashToken(rawToken),
        code,
        expiresAt
      }
    });

    const deepLink = this.botUsername ? `https://t.me/${this.botUsername}?start=link_${rawToken}` : null;

    return {
      code,
      token: rawToken,
      deepLink,
      botUsername: this.botUsername,
      expiresAt
    };
  }

  async unlink(userId: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        telegramId: null,
        telegramUsername: null,
        telegramLinkedAt: null
      }
    });

    return { success: true };
  }

  async consumeLink(dto: ConsumeTelegramLinkDto) {
    const tokenHash = hashToken(dto.token);
    const linkToken = await this.prisma.telegramLinkToken.findUnique({
      where: { tokenHash },
      include: { user: true }
    });

    if (!linkToken || linkToken.consumedAt || linkToken.expiresAt.getTime() <= Date.now()) {
      throw new UnauthorizedException("Telegram link token is invalid or expired");
    }

    const existingUser = await this.prisma.user.findUnique({
      where: { telegramId: dto.telegramId },
      select: { id: true }
    });

    if (existingUser && existingUser.id !== linkToken.userId) {
      throw new ConflictException("Telegram account is already linked to another user.");
    }

    const user = await this.prisma.$transaction(async (tx) => {
      const linkedUser = await tx.user.update({
        where: { id: linkToken.userId },
        data: {
          telegramId: dto.telegramId,
          telegramUsername: dto.telegramUsername ?? null,
          telegramLinkedAt: new Date()
        }
      });

      await tx.telegramLinkToken.update({
        where: { id: linkToken.id },
        data: { consumedAt: new Date() }
      });

      return linkedUser;
    });

    return this.buildLinkedSummary(user);
  }

  async getLinkedSession(telegramId: string) {
    const user = await this.prisma.user.findUnique({
      where: { telegramId },
      select: {
        id: true,
        email: true,
        phone: true,
        role: true,
        telegramUsername: true,
        language: true,
        playerProfile: {
          select: {
            id: true,
            fullName: true
          }
        }
      }
    });

    if (!user) {
      return { linked: false };
    }

    return {
      linked: true,
      user
    };
  }

  async setLanguage(dto: SetTelegramLanguageDto) {
    const user = await this.prisma.user.findUnique({
      where: { telegramId: dto.telegramId },
      select: { id: true }
    });

    if (!user) {
      return {
        linked: false,
        language: dto.language
      };
    }

    const updated = await this.prisma.user.update({
      where: { id: user.id },
      data: { language: dto.language },
      select: {
        id: true,
        email: true,
        role: true,
        telegramUsername: true,
        language: true
      }
    });

    return {
      linked: true,
      user: updated
    };
  }

  async registerTelegramPlayer(dto: RegisterTelegramPlayerDto) {
    const existingTelegramUser = await this.prisma.user.findUnique({
      where: { telegramId: dto.telegramId },
      include: { playerProfile: true }
    });

    if (existingTelegramUser) {
      return {
        status: "already_registered" as const,
        user: this.serializeTelegramUser(existingTelegramUser)
      };
    }

    const phone = this.normalizePhone(dto.phone);
    if (!phone) {
      throw new BadRequestException("Phone is required");
    }

    const existingPhoneUser = await this.prisma.user.findUnique({
      where: { phone },
      select: {
        id: true,
        role: true,
        telegramId: true,
        telegramUsername: true,
        phone: true
      }
    });

    if (existingPhoneUser) {
      if (existingPhoneUser.role !== Role.PLAYER) {
        return {
          status: "site_required" as const,
          message: "Организаторы регистрируются на сайте"
        };
      }

      if (existingPhoneUser.telegramId) {
        throw new ConflictException("Phone is already linked to Telegram");
      }

      return {
        status: "phone_exists" as const,
        phone
      };
    }

    const city = await this.resolveCity(dto.city);
    const fullName = this.normalizeName(dto.fullName);
    const passwordHash = await hashPassword(randomBytes(32).toString("hex"));

    const user = await this.prisma.$transaction(async (tx) => {
      const createdUser = await tx.user.create({
        data: {
          email: this.buildTelegramEmail(dto.telegramId),
          phone,
          passwordHash,
          role: Role.PLAYER,
          isVerified: true,
          telegramId: dto.telegramId,
          telegramUsername: dto.telegramUsername ?? null,
          telegramLinkedAt: new Date(),
          language: dto.language
        }
      });

      await tx.player.create({
        data: {
          userId: createdUser.id,
          fullName,
          countryId: city.countryId,
          cityId: city.id,
          clubId: null,
          elo: 0,
          wins: 0,
          losses: 0,
          achievements: []
        }
      });

      return createdUser;
    });

    return {
      status: "registered" as const,
      user: this.serializeTelegramUser(user)
    };
  }

  async linkExistingTelegramPlayer(dto: LinkExistingTelegramPlayerDto) {
    const phone = this.normalizePhone(dto.phone);
    if (!phone) {
      throw new BadRequestException("Phone is required");
    }

    const existingTelegramUser = await this.prisma.user.findUnique({
      where: { telegramId: dto.telegramId },
      include: { playerProfile: true }
    });

    if (existingTelegramUser) {
      return {
        status: "already_registered" as const,
        user: this.serializeTelegramUser(existingTelegramUser)
      };
    }

    const user = await this.prisma.user.findUnique({
      where: { phone },
      include: { playerProfile: true }
    });

    if (!user) {
      throw new NotFoundException("User with this phone was not found");
    }

    if (user.role !== Role.PLAYER) {
      return {
        status: "site_required" as const,
        message: "Организаторы регистрируются на сайте"
      };
    }

    if (user.telegramId && user.telegramId !== dto.telegramId) {
      throw new ConflictException("Phone is already linked to Telegram");
    }

    const updated = await this.prisma.user.update({
      where: { id: user.id },
      data: {
        telegramId: dto.telegramId,
        telegramUsername: dto.telegramUsername ?? user.telegramUsername,
        telegramLinkedAt: new Date()
      },
      include: { playerProfile: true }
    });

    return {
      status: "linked" as const,
      user: this.serializeTelegramUser(updated)
    };
  }

  async getUpcomingTournaments() {
    const now = new Date();
    const tournaments = await this.prisma.tournament.findMany({
      where: {
        status: {
          in: [TournamentStatus.REGISTRATION, TournamentStatus.LIVE]
        },
        startsAt: {
          gte: now
        }
      },
      include: {
        club: {
          select: {
            name: true
          }
        },
        discipline: {
          select: {
            name: true
          }
        },
        applications: {
          where: {
            status: ApplicationStatus.APPROVED
          },
          select: {
            id: true
          }
        },
        bracketParticipants: {
          select: {
            id: true
          }
        }
      },
      orderBy: {
        startsAt: "asc"
      },
      take: 10
    });

    return tournaments.map((tournament) => ({
      id: tournament.id,
      title: tournament.title,
      startsAt: tournament.startsAt,
      clubName: tournament.club.name,
      disciplineName: tournament.discipline.name,
      participantsCount: Math.max(tournament.participants, tournament.applications.length, tournament.bracketParticipants.length),
      capacity: tournament.bracketSize,
      status: tournament.status,
      participantSelectionMode: tournament.participantSelectionMode,
      canJoinInBot: tournament.participantSelectionMode === ParticipantSelectionMode.DIRECT,
      siteUrl: `${this.appUrl}/tournaments/${tournament.id}`
    }));
  }

  async joinTournament(telegramId: string, tournamentId: string) {
    const user = await this.requireRole(telegramId, [Role.PLAYER]);
    const player = await this.prisma.player.findUnique({
      where: { userId: user.id },
      select: { id: true }
    });

    if (!player) {
      throw new NotFoundException("Player profile not found");
    }

    const tournament = await this.prisma.tournament.findUnique({
      where: { id: tournamentId },
      select: {
        id: true,
        title: true,
        status: true,
        bracketSize: true,
        participantSelectionMode: true,
        _count: {
          select: {
            bracketMatches: true,
            bracketParticipants: true
          }
        }
      }
    });

    if (!tournament) {
      throw new NotFoundException("Tournament not found");
    }

    if (tournament.participantSelectionMode !== ParticipantSelectionMode.DIRECT) {
      return {
        status: "requires_confirmation" as const,
        siteUrl: `${this.appUrl}/tournaments/${tournament.id}`
      };
    }

    const existingParticipant = await this.prisma.bracketParticipant.findFirst({
      where: {
        tournamentId,
        playerId: player.id
      },
      select: { id: true }
    });

    const existingApplication = await this.prisma.application.findUnique({
      where: {
        playerId_tournamentId: {
          playerId: player.id,
          tournamentId
        }
      },
      select: {
        status: true
      }
    });

    if (existingParticipant || existingApplication?.status === ApplicationStatus.APPROVED) {
      return {
        status: "already_participant" as const,
        siteUrl: `${this.appUrl}/tournaments/${tournament.id}`
      };
    }

    if (tournament.bracketSize && tournament._count.bracketParticipants >= tournament.bracketSize) {
      return {
        status: "full" as const
      };
    }

    await this.applicationsService.create(this.toActor(user), tournamentId);

    return {
      status: "joined" as const,
      siteUrl: `${this.appUrl}/tournaments/${tournament.id}`
    };
  }

  async getMyTournaments(telegramId: string) {
    const user = await this.requireRole(telegramId, [Role.PLAYER]);
    const player = await this.prisma.player.findUnique({
      where: { userId: user.id },
      select: { id: true }
    });

    if (!player) {
      throw new NotFoundException("Player profile not found");
    }

    const tournaments = await this.prisma.tournament.findMany({
      where: {
        OR: [
          {
            applications: {
              some: {
                playerId: player.id,
                status: ApplicationStatus.APPROVED
              }
            }
          },
          {
            bracketParticipants: {
              some: {
                playerId: player.id
              }
            }
          }
        ]
      },
      include: {
        club: {
          select: {
            name: true
          }
        }
      },
      orderBy: {
        startsAt: "asc"
      }
    });

    return tournaments.map((tournament) => ({
      id: tournament.id,
      title: tournament.title,
      startsAt: tournament.startsAt,
      clubName: tournament.club.name,
      status: tournament.status,
      siteUrl: `${this.appUrl}/tournaments/${tournament.id}`
    }));
  }

  async findPlayerByTelegramUsername(username: string) {
    const normalizedUsername = this.normalizeTelegramUsername(username);
    if (!normalizedUsername) {
      throw new BadRequestException("Telegram username is required");
    }

    const user = await this.prisma.user.findFirst({
      where: {
        role: Role.PLAYER,
        telegramId: {
          not: null
        },
        telegramUsername: {
          equals: normalizedUsername,
          mode: "insensitive"
        }
      },
      select: {
        telegramId: true,
        telegramUsername: true,
        language: true,
        playerProfile: {
          select: {
            fullName: true
          }
        }
      }
    });

    if (!user?.telegramId || !user.playerProfile) {
      return {
        found: false as const,
        username: normalizedUsername
      };
    }

    return {
      found: true as const,
      telegramId: user.telegramId,
      telegramUsername: user.telegramUsername,
      fullName: user.playerProfile.fullName,
      language: user.language
    };
  }

  async getPendingTelegramNotifications(limit = 50) {
    return this.notificationsService.getPendingTelegramNotifications(limit);
  }

  async markTelegramNotificationDelivered(id: string) {
    return this.notificationsService.markTelegramDelivered(id);
  }

  async sweepTelegramReminders() {
    return this.notificationsService.sweepTelegramReminders();
  }

  async createGroupMatch(dto: CreateTelegramGroupMatchDto) {
    if (dto.playerOneTelegramId === dto.playerTwoTelegramId) {
      throw new BadRequestException("Match players must be different");
    }

    const match = await this.prisma.telegramGroupMatch.create({
      data: {
        chatId: dto.chatId,
        messageId: dto.messageId ?? null,
        playerOneTelegramId: dto.playerOneTelegramId,
        playerOneName: dto.playerOneName.trim(),
        playerTwoTelegramId: dto.playerTwoTelegramId,
        playerTwoName: dto.playerTwoName.trim(),
        createdByTelegramId: dto.createdByTelegramId
      }
    });

    return this.withHeadToHead(match);
  }

  async setGroupMatchMessage(id: string, dto: UpdateTelegramGroupMatchMessageDto) {
    const match = await this.requireGroupMatchInChat(id, dto.chatId);

    if (match.status !== TelegramGroupMatchStatus.LIVE) {
      throw new ConflictException("Match is not live");
    }

    const updated = await this.prisma.telegramGroupMatch.update({
      where: { id },
      data: {
        messageId: dto.messageId
      }
    });

    return this.withHeadToHead(updated);
  }

  async listActiveGroupMatches(chatId: string) {
    const matches = await this.prisma.telegramGroupMatch.findMany({
      where: {
        chatId,
        status: TelegramGroupMatchStatus.LIVE
      },
      orderBy: {
        createdAt: "desc"
      },
      take: 10
    });

    return Promise.all(matches.map((match) => this.withHeadToHead(match)));
  }

  async listMyGroupMatches(telegramId: string) {
    const matches = await this.prisma.telegramGroupMatch.findMany({
      where: {
        OR: [
          { playerOneTelegramId: telegramId },
          { playerTwoTelegramId: telegramId },
          { createdByTelegramId: telegramId }
        ]
      },
      orderBy: {
        createdAt: "desc"
      },
      take: 10
    });

    return Promise.all(matches.map((match) => this.withHeadToHead(match)));
  }

  async addGroupMatchPoint(id: string, dto: TelegramGroupMatchPointDto) {
    const match = await this.requireMutableGroupMatch(id, dto);

    const updated = await this.prisma.telegramGroupMatch.update({
      where: { id: match.id },
      data: {
        scoreOne: dto.side === 1 ? { increment: 1 } : undefined,
        scoreTwo: dto.side === 2 ? { increment: 1 } : undefined,
        lastPointSide: dto.side
      }
    });

    return this.withHeadToHead(updated);
  }

  async undoGroupMatchPoint(id: string, dto: TelegramGroupMatchActionDto) {
    const match = await this.requireMutableGroupMatch(id, dto);
    const side = match.lastPointSide;

    if (side !== 1 && side !== 2) {
      return match;
    }

    if (side === 1 && match.scoreOne <= 0) {
      return match;
    }

    if (side === 2 && match.scoreTwo <= 0) {
      return match;
    }

    const updated = await this.prisma.telegramGroupMatch.update({
      where: { id: match.id },
      data: {
        scoreOne: side === 1 ? { decrement: 1 } : undefined,
        scoreTwo: side === 2 ? { decrement: 1 } : undefined,
        lastPointSide: null
      }
    });

    return this.withHeadToHead(updated);
  }

  async finishGroupMatch(id: string, dto: TelegramGroupMatchActionDto) {
    const match = await this.requireMutableGroupMatch(id, dto);

    if (match.scoreOne === match.scoreTwo) {
      throw new BadRequestException("Cannot finish a tied match");
    }

    const winnerTelegramId = match.scoreOne > match.scoreTwo ? match.playerOneTelegramId : match.playerTwoTelegramId;
    const loserTelegramId = match.scoreOne > match.scoreTwo ? match.playerTwoTelegramId : match.playerOneTelegramId;

    const updated = await this.prisma.$transaction(async (tx) => {
      const finished = await tx.telegramGroupMatch.update({
        where: { id: match.id },
        data: {
          status: TelegramGroupMatchStatus.FINISHED,
          finishedAt: new Date()
        }
      });

      await this.updateRegisteredGroupStats(tx, winnerTelegramId, loserTelegramId);
      return finished;
    });

    return this.withHeadToHead(updated);
  }

  async cancelGroupMatch(id: string, dto: TelegramGroupMatchActionDto) {
    const match = await this.requireGroupMatchInChat(id, dto.chatId);

    if (match.status !== TelegramGroupMatchStatus.LIVE) {
      throw new ConflictException("Match is already closed");
    }

    if (!dto.actorIsAdmin && match.createdByTelegramId !== dto.actorTelegramId) {
      throw new ForbiddenException("Only creator or group admin can cancel this match");
    }

    const updated = await this.prisma.telegramGroupMatch.update({
      where: { id: match.id },
      data: {
        status: TelegramGroupMatchStatus.CANCELLED,
        finishedAt: new Date()
      }
    });

    return this.withHeadToHead(updated);
  }

  private async requireMutableGroupMatch(id: string, dto: TelegramGroupMatchActionDto) {
    const match = await this.requireGroupMatchInChat(id, dto.chatId);

    if (match.status !== TelegramGroupMatchStatus.LIVE) {
      throw new ConflictException("Match is already closed");
    }

    if (!this.canChangeGroupMatch(match, dto.actorTelegramId, dto.actorIsAdmin)) {
      throw new ForbiddenException("You are not a participant of this match");
    }

    return match;
  }

  private async requireGroupMatchInChat(id: string, chatId: string) {
    const match = await this.prisma.telegramGroupMatch.findUnique({
      where: { id }
    });

    if (!match) {
      throw new NotFoundException("Match not found");
    }

    if (match.chatId.startsWith("direct:")) {
      return match;
    }

    if (match.chatId !== chatId) {
      throw new ForbiddenException("Match belongs to another group");
    }

    return match;
  }

  private canChangeGroupMatch(match: TelegramGroupMatch, actorTelegramId: string, actorIsAdmin: boolean) {
    return (
      actorIsAdmin ||
      match.playerOneTelegramId === actorTelegramId ||
      match.playerTwoTelegramId === actorTelegramId ||
      match.createdByTelegramId === actorTelegramId
    );
  }

  private async updateRegisteredGroupStats(
    tx: Prisma.TransactionClient,
    winnerTelegramId: string,
    loserTelegramId: string
  ) {
    const [winner, loser] = await Promise.all([
      tx.user.findUnique({
        where: { telegramId: winnerTelegramId },
        select: {
          playerProfile: {
            select: { id: true }
          }
        }
      }),
      tx.user.findUnique({
        where: { telegramId: loserTelegramId },
        select: {
          playerProfile: {
            select: { id: true }
          }
        }
      })
    ]);

    if (!winner?.playerProfile?.id || !loser?.playerProfile?.id) {
      return;
    }

    await Promise.all([
      tx.player.update({
        where: { id: winner.playerProfile.id },
        data: { wins: { increment: 1 } }
      }),
      tx.player.update({
        where: { id: loser.playerProfile.id },
        data: { losses: { increment: 1 } }
      })
    ]);
  }

  private async withHeadToHead(match: TelegramGroupMatch) {
    const history = await this.prisma.telegramGroupMatch.findMany({
      where: {
        status: TelegramGroupMatchStatus.FINISHED,
        OR: [
          {
            playerOneTelegramId: match.playerOneTelegramId,
            playerTwoTelegramId: match.playerTwoTelegramId
          },
          {
            playerOneTelegramId: match.playerTwoTelegramId,
            playerTwoTelegramId: match.playerOneTelegramId
          }
        ]
      },
      select: {
        playerOneTelegramId: true,
        playerTwoTelegramId: true,
        scoreOne: true,
        scoreTwo: true
      }
    });

    const headToHead = history.reduce(
      (summary, item) => {
        if (item.scoreOne === item.scoreTwo) {
          return summary;
        }

        const winnerTelegramId = item.scoreOne > item.scoreTwo ? item.playerOneTelegramId : item.playerTwoTelegramId;
        if (winnerTelegramId === match.playerOneTelegramId) {
          summary.playerOneWins += 1;
        }
        if (winnerTelegramId === match.playerTwoTelegramId) {
          summary.playerTwoWins += 1;
        }

        return summary;
      },
      { playerOneWins: 0, playerTwoWins: 0 }
    );

    return {
      ...match,
      headToHead
    };
  }

  private async requireLinkedUser(telegramId: string) {
    const user = await this.prisma.user.findUnique({
      where: { telegramId }
    });

    if (!user) {
      throw new UnauthorizedException("Telegram account is not linked.");
    }

    return user;
  }

  private async requireRole(telegramId: string, roles: Role[]) {
    const user = await this.requireLinkedUser(telegramId);

    if (!roles.some((role) => canAccessRole(this.configService, user, role))) {
      throw new ForbiddenException("This action is not available for your role.");
    }

    return user;
  }

  async getReportableMatches(tournamentId: string, telegramId: string) {
    const user = await this.requireRole(telegramId, [Role.ORGANIZER, Role.ADMIN]);
    const tournament = await this.prisma.tournament.findUnique({
      where: { id: tournamentId },
      select: { id: true, title: true, organizerId: true }
    });
    if (!tournament) {
      throw new NotFoundException("Tournament not found");
    }
    if (user.role !== Role.ADMIN && tournament.organizerId !== user.id) {
      throw new ForbiddenException("Only the tournament organizer can report results.");
    }

    const matches = await this.prisma.bracketMatch.findMany({
      where: {
        tournamentId,
        status: { in: ["READY", "LIVE"] },
        player1Id: { not: null },
        player2Id: { not: null }
      },
      select: {
        id: true,
        round: true,
        matchNumber: true,
        player1: { select: { id: true, name: true } },
        player2: { select: { id: true, name: true } }
      },
      orderBy: [{ round: "asc" }, { matchNumber: "asc" }]
    });

    return {
      tournamentId,
      title: tournament.title,
      matches: matches
        .filter((match) => match.player1 && match.player2)
        .map((match) => ({
          matchId: match.id,
          round: match.round,
          matchNumber: match.matchNumber,
          playerA: { participantId: match.player1!.id, name: match.player1!.name },
          playerB: { participantId: match.player2!.id, name: match.player2!.name }
        }))
    };
  }

  async reportMatchResult(
    matchId: string,
    telegramId: string,
    input: { winnerParticipantId: string; player1Score?: number; player2Score?: number }
  ) {
    const user = await this.requireRole(telegramId, [Role.ORGANIZER, Role.ADMIN]);
    // updateMatchResult re-checks that this organizer actually owns the match's tournament.
    return this.bracketMatchesService.updateMatchResult(
      matchId,
      {
        winnerId: input.winnerParticipantId,
        player1Score: input.player1Score,
        player2Score: input.player2Score
      },
      this.toActor(user)
    );
  }

  private toActor(user: User): RequestUser {
    return {
      sub: user.id,
      email: user.email,
      role: user.role,
      capabilities: getAuthCapabilities(this.configService, user),
      type: "access"
    };
  }

  private buildLinkedSummary(user: User) {
    return {
      linked: true,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        telegramId: user.telegramId,
        telegramUsername: user.telegramUsername,
        telegramLinkedAt: user.telegramLinkedAt,
        language: user.language
      }
    };
  }

  private serializeTelegramUser(user: User & { playerProfile?: { id: string; fullName: string } | null }) {
    return {
      id: user.id,
      role: user.role,
      phone: user.phone,
      telegramId: user.telegramId,
      telegramUsername: user.telegramUsername,
      telegramLinkedAt: user.telegramLinkedAt,
      language: user.language,
      player: user.playerProfile
        ? {
            id: user.playerProfile.id,
            fullName: user.playerProfile.fullName
          }
        : null
    };
  }

  private async resolveCity(input: string) {
    const normalized = this.normalizeValue(input);
    if (!normalized) {
      throw new BadRequestException("City is required");
    }

    const cities = await this.prisma.city.findMany({
      select: {
        id: true,
        name: true,
        countryId: true
      }
    });

    const city = cities.find((item) => this.normalizeValue(item.name) === normalized);
    if (!city) {
      throw new BadRequestException("City was not found");
    }

    return city;
  }

  private normalizeName(input: string) {
    const fullName = input.trim().replace(/\s+/g, " ");
    if (!fullName) {
      throw new BadRequestException("Name is required");
    }

    return fullName;
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

  private buildTelegramEmail(telegramId: string) {
    const safeTelegramId = telegramId.replace(/[^0-9]+/g, "");
    return `telegram-${safeTelegramId}@telegram.billard.local`;
  }

  private normalizeValue(value: string) {
    return value.toLowerCase().replace(/[^a-zа-яё0-9]+/gi, "");
  }

  private normalizeTelegramUsername(value: string) {
    return value.trim().replace(/^@+/, "").replace(/[^a-zA-Z0-9_]/g, "");
  }
}
