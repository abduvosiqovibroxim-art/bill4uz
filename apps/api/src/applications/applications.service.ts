import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import {
  ApplicationStatus,
  ParticipantSelectionMode,
  Prisma,
  Role,
  TournamentStatus,
  TournamentType
} from "@prisma/client";
import { RequestUser } from "../auth/dto";
import { PrismaService } from "../common/prisma.service";
import { assertSupportedBracketSize } from "../brackets/bracket.utils";
import { NotificationsService } from "../notifications/notifications.service";
import { AuditService } from "../platform/audit.service";
import { isPlayerLevelInRange, playerLevelFromPoints } from "../players/player-levels";
import { tournamentDisciplineKeyFromName } from "../tournaments/disciplines";

const applicationInclude = Prisma.validator<Prisma.ApplicationInclude>()({
  player: {
    include: {
      city: true,
      country: true,
      club: {
        include: {
          city: true,
          country: true
        }
      }
    }
  },
  tournament: {
    include: {
      club: {
        include: {
          city: true,
          country: true
        }
      },
      discipline: true
    }
  }
});

type ApplicationRecord = Prisma.ApplicationGetPayload<{ include: typeof applicationInclude }>;

const cityKeyMap: Record<string, string> = {
  tashkent: "tashkent",
  samarkand: "samarkand",
  bukhara: "bukhara",
  andijan: "andijan",
  namangan: "namangan",
  fergana: "fergana",
  nukus: "nukus"
};

const countryKeyMap: Record<string, string> = {
  uz: "uzbekistan",
  uzbekistan: "uzbekistan"
};

@Injectable()
export class ApplicationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
    private readonly auditService: AuditService
  ) {}

  findAll(filters: { tournamentId?: string; status?: string }) {
    return this.prisma.application.findMany({
      where: {
        tournamentId: filters.tournamentId,
        status: filters.status as ApplicationStatus | undefined
      },
      include: applicationInclude,
      orderBy: { createdAt: "desc" }
    }).then((items) => items.map((item) => this.serializeApplication(item)));
  }

  async create(actor: RequestUser, tournamentId: string) {
    const player = await this.prisma.player.findUnique({
      where: { userId: actor.sub }
    });

    if (!player) {
      throw new NotFoundException("Player profile not found");
    }

    const tournament = await this.prisma.tournament.findUnique({
      where: { id: tournamentId },
      select: {
        id: true,
        status: true,
        bracketSize: true,
        disciplineId: true,
        tournamentType: true,
        participantSelectionMode: true,
        minPlayerLevel: true,
        maxPlayerLevel: true,
        _count: {
          select: {
            bracketMatches: true
          }
        }
      }
    });

    if (!tournament) {
      throw new NotFoundException("Tournament not found");
    }

    if (tournament.status !== TournamentStatus.REGISTRATION) {
      throw new BadRequestException("Applications are only available while tournament registration is open.");
    }

    if (tournament._count.bracketMatches > 0) {
      throw new BadRequestException("Applications are closed after bracket generation.");
    }

    if (tournament.participantSelectionMode === ParticipantSelectionMode.MANUAL_DRAW) {
      throw new BadRequestException("Tournament registration is managed manually.");
    }

    const playerLevel = playerLevelFromPoints(player.levelPoints);
    if (!isPlayerLevelInRange(playerLevel, tournament.minPlayerLevel, tournament.maxPlayerLevel)) {
      throw new BadRequestException("Tournament is not available for your level.");
    }

    const isDirectJoin = this.isDirectJoinTournament(
      tournament.tournamentType,
      tournament.participantSelectionMode
    );

    if (isDirectJoin) {
      const joined = await this.joinDirectTournament(tournamentId, player, tournament.bracketSize, tournament.disciplineId);

      if (joined.notifyApproved) {
        await this.notificationsService.notifyApplicationModerated(joined.application.id);
      }

      return this.serializeApplication(joined.application);
    }

    const existingApplication = await this.prisma.application.findUnique({
      where: {
        playerId_tournamentId: {
          playerId: player.id,
          tournamentId
        }
      },
      include: applicationInclude
    });

    if (existingApplication) {
      throw new ConflictException("You have already applied to this tournament.");
    }

    const created = await this.prisma.application.create({
      data: { playerId: player.id, tournamentId, status: ApplicationStatus.PENDING },
      include: applicationInclude
    });

    await this.notificationsService.notifyApplicationSubmitted(created.id);

    return this.serializeApplication(created);
  }

  private async joinDirectTournament(
    tournamentId: string,
    player: Prisma.PlayerGetPayload<Record<string, never>>,
    bracketSize: number | null,
    disciplineId: string
  ) {
    assertSupportedBracketSize(bracketSize);

    return this.prisma.$transaction(async (tx) => {
      const existingApplication = await tx.application.findUnique({
        where: {
          playerId_tournamentId: {
            playerId: player.id,
            tournamentId
          }
        },
        include: applicationInclude
      });

      const existingParticipant = await tx.bracketParticipant.findFirst({
        where: {
          tournamentId,
          playerId: player.id
        },
        select: { id: true }
      });

      let notifyApproved = false;
      let application: ApplicationRecord;

      if (existingApplication) {
        if (existingApplication.status === ApplicationStatus.APPROVED) {
          application = existingApplication;
        } else {
          application = await tx.application.update({
            where: { id: existingApplication.id },
            data: { status: ApplicationStatus.APPROVED },
            include: applicationInclude
          });
          notifyApproved = true;
        }
      } else {
        application = await tx.application.create({
          data: { playerId: player.id, tournamentId, status: ApplicationStatus.APPROVED },
          include: applicationInclude
        });
        notifyApproved = true;
      }

      if (existingParticipant) {
        return { application, notifyApproved };
      }

      const existingParticipants = await tx.bracketParticipant.findMany({
        where: { tournamentId },
        orderBy: { seed: "asc" },
        select: { seed: true }
      });

      if (existingParticipants.length >= bracketSize!) {
        throw new BadRequestException("Tournament participant pool is already full.");
      }

      const nextSeed = this.resolveNextSeed(existingParticipants.map((participant) => participant.seed), bracketSize!);
      if (!nextSeed) {
        throw new BadRequestException("Tournament participant pool is already full.");
      }

      await tx.bracketParticipant.create({
        data: {
          tournamentId,
          playerId: player.id,
          name: player.fullName,
          seed: nextSeed
        }
      });

      await this.applyParticipationPoints(tx, player.id, disciplineId);
      return { application, notifyApproved };
    });
  }

  async mine(tournamentId: string, actor: RequestUser) {
    const player = await this.prisma.player.findUnique({
      where: { userId: actor.sub },
      select: { id: true }
    });

    if (!player) {
      throw new NotFoundException("Player profile not found");
    }

    const application = await this.prisma.application.findUnique({
      where: {
        playerId_tournamentId: {
          playerId: player.id,
          tournamentId
        }
      },
      include: applicationInclude
    });

    return application ? this.serializeApplication(application) : null;
  }

  async forTournament(tournamentId: string, actor: RequestUser) {
    const tournament = await this.prisma.tournament.findUnique({
      where: { id: tournamentId },
      select: {
        organizerId: true,
        club: {
          select: {
            userId: true
          }
        }
      }
    });

    if (!tournament) {
      throw new NotFoundException("Tournament not found");
    }

    this.assertCanModerate(actor, tournament.organizerId, tournament.club?.userId);

    return this.prisma.application.findMany({
      where: { tournamentId },
      include: applicationInclude,
      orderBy: { createdAt: "desc" }
    }).then((items) => items.map((item) => this.serializeApplication(item)));
  }

  async moderate(id: string, status: ApplicationStatus, actor: RequestUser) {
    const application = await this.prisma.application.findUnique({
      where: { id },
      include: applicationInclude
    });

    if (!application) {
      throw new NotFoundException("Application not found");
    }

    this.assertCanModerate(actor, application.tournament.organizerId, application.tournament.club.userId);
    assertSupportedBracketSize(application.tournament.bracketSize);

    const updated = await this.prisma.$transaction(async (tx) => {
      const bracketGenerated = await tx.bracketMatch.count({
        where: { tournamentId: application.tournamentId }
      });

      if (bracketGenerated > 0) {
        throw new BadRequestException("Applications cannot be moderated after bracket generation.");
      }

      const nextApplication = await tx.application.update({
        where: { id },
        data: { status },
        include: applicationInclude
      });

      if (status === ApplicationStatus.APPROVED) {
        const existingParticipant = await tx.bracketParticipant.findFirst({
          where: {
            tournamentId: application.tournamentId,
            playerId: application.playerId
          },
          select: { id: true }
        });

        if (!existingParticipant) {
          const existingParticipants = await tx.bracketParticipant.findMany({
            where: { tournamentId: application.tournamentId },
            orderBy: { seed: "asc" },
            select: { seed: true }
          });

          if (existingParticipants.length >= application.tournament.bracketSize!) {
            throw new BadRequestException("Tournament participant pool is already full.");
          }

          const nextSeed = this.resolveNextSeed(
            existingParticipants.map((participant) => participant.seed),
            application.tournament.bracketSize!
          );

          if (!nextSeed) {
            throw new BadRequestException("Tournament participant pool is already full.");
          }

          await tx.bracketParticipant.create({
            data: {
              tournamentId: application.tournamentId,
              playerId: application.playerId,
              name: application.player.fullName,
              seed: nextSeed
            }
          });

          await this.applyParticipationPoints(tx, application.playerId, application.tournament.disciplineId);
        }
      }

      if (status === ApplicationStatus.REJECTED) {
        await tx.bracketParticipant.deleteMany({
          where: {
            tournamentId: application.tournamentId,
            playerId: application.playerId
          }
        });
      }

      return nextApplication;
    });

    await this.notificationsService.notifyApplicationModerated(updated.id);
    await this.auditService.log({
      actor,
      action: "application.moderate",
      entityType: "application",
      entityId: updated.id,
      metadata: {
        status: updated.status,
        tournamentId: updated.tournamentId,
        playerId: updated.playerId
      }
    });
    return this.serializeApplication(updated);
  }

  private isDirectJoinTournament(
    tournamentType: TournamentType,
    selectionMode: ParticipantSelectionMode
  ) {
    if (selectionMode === ParticipantSelectionMode.DIRECT) {
      return true;
    }

    if (selectionMode === ParticipantSelectionMode.MANUAL_DRAW) {
      return false;
    }

    return tournamentType !== TournamentType.PRO;
  }

  private resolveNextSeed(occupiedSeedList: number[], bracketSize: number) {
    const occupiedSeeds = new Set(occupiedSeedList);
    return Array.from({ length: bracketSize }, (_, index) => index + 1).find((seed) => !occupiedSeeds.has(seed));
  }

  private async applyParticipationPoints(tx: Prisma.TransactionClient, playerId: string, disciplineId: string) {
    const player = await tx.player.findUnique({
      where: { id: playerId },
      select: {
        id: true,
        levelPoints: true,
        cityId: true
      }
    });

    if (!player) {
      return;
    }

    const nextPoints = player.levelPoints + 1;

    await tx.player.update({
      where: { id: playerId },
      data: {
        levelPoints: nextPoints,
        tournamentsPlayed: { increment: 1 },
        level: playerLevelFromPoints(nextPoints)
      }
    });
    await this.upsertRanking(tx, playerId, disciplineId, player.cityId, nextPoints);
  }

  private async upsertRanking(
    tx: Prisma.TransactionClient,
    playerId: string,
    disciplineId: string,
    cityId: string,
    points: number
  ) {
    if (!("ranking" in tx) || !tx.ranking?.upsert) {
      return;
    }

    await tx.ranking.upsert({
      where: {
        playerId_disciplineId_cityId: {
          playerId,
          disciplineId,
          cityId
        }
      },
      update: { points },
      create: {
        playerId,
        disciplineId,
        cityId,
        points,
        position: 0
      }
    });
  }

  private assertCanModerate(actor: RequestUser, organizerId: string, clubUserId?: string | null) {
    if (actor.role === Role.ADMIN) {
      return;
    }

    if (actor.role === Role.ORGANIZER && actor.sub === organizerId) {
      return;
    }

    throw new ForbiddenException("Forbidden");
  }

  private serializeApplication(application: ApplicationRecord) {
    return {
      ...application,
      player: {
        ...application.player,
        cityKey: this.cityKeyFromName(application.player.city?.name),
        countryKey: this.countryKeyFromCountry(application.player.country)
      },
      tournament: {
        ...application.tournament,
        cityKey: this.cityKeyFromName(application.tournament.club?.city?.name),
        disciplineKey: this.disciplineKeyFromName(application.tournament.discipline?.name),
        clubPreview: application.tournament.club
          ? {
              id: application.tournament.club.id,
              name: application.tournament.club.name,
              address: application.tournament.club.address,
              cityKey: this.cityKeyFromName(application.tournament.club.city?.name),
              countryKey: this.countryKeyFromCountry(application.tournament.club.country)
            }
          : null
      }
    };
  }

  private cityKeyFromName(cityName?: string | null) {
    return cityKeyMap[this.normalizeValue(cityName)] ?? "tashkent";
  }

  private countryKeyFromCountry(country?: { code?: string | null; name?: string | null } | null) {
    const codeKey = countryKeyMap[this.normalizeValue(country?.code)];
    const nameKey = countryKeyMap[this.normalizeValue(country?.name)];
    return codeKey ?? nameKey ?? "uzbekistan";
  }

  private disciplineKeyFromName(disciplineName?: string | null) {
    return tournamentDisciplineKeyFromName(disciplineName);
  }

  private normalizeValue(value?: string | null) {
    return (value ?? "").toLowerCase().replace(/[^a-z0-9]+/g, "");
  }
}
