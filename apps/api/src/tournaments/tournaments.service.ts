import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import {
  BilliardKind,
  ApplicationStatus,
  BracketFormat,
  BracketMatchPhase,
  BracketMatchStatus,
  ParticipantSelectionMode,
  PlayerLevel,
  Prisma,
  Role,
  TournamentBracketSystem,
  TournamentCategory,
  TournamentFormat,
  TournamentLevel,
  TournamentType,
  TournamentStatus
} from "@prisma/client";
import { RequestUser } from "../auth/dto";
import { PrismaService } from "../common/prisma.service";
import { AuditService } from "../platform/audit.service";
import {
  CreateTournamentDto,
  LocalizedTextDto,
  TournamentBracketMatchDto,
  TournamentBracketRoundDto,
  TournamentBracketType,
  TournamentComputedFields,
  TournamentDetailComputedFields,
  TournamentMatchPhase,
  TournamentMatchPlayerDto,
  TournamentMatchStatus,
  TournamentParticipantDto,
  TournamentParticipantStatus,
  TournamentRegulationDto,
  TournamentRegulationInputDto,
  TournamentResultDto,
  UpdateTournamentDto
} from "./dto";
import {
  TOURNAMENT_DISCIPLINE_NAMES,
  isTournamentDisciplineName,
  tournamentDisciplineKeyFromName,
  tournamentDisciplineLabelFromName,
  tournamentDisciplineNameFromInput
} from "./disciplines";
import {
  isActiveBracketSystem,
  isActiveTournamentFormat,
  labelForBilliardKind,
  labelForBracketSystem,
  labelForParticipantSelectionMode,
  labelForPlayerLevel,
  labelForTournamentCategory,
  labelForTournamentFormat,
  labelForTournamentLevel,
  labelForTournamentType
} from "./taxonomy";
import { lowerRoundPlaceRange } from "../brackets/bracket.utils";

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

const playerLevelWeight: Record<PlayerLevel, number> = {
  [PlayerLevel.NOVICE]: 0,
  [PlayerLevel.AMATEUR]: 1,
  [PlayerLevel.STRONG_AMATEUR]: 2,
  [PlayerLevel.SEMI_PRO]: 3,
  [PlayerLevel.PRO]: 4
};

const participantPlayerInclude = Prisma.validator<Prisma.PlayerInclude>()({
  city: true,
  country: true,
  club: true
});

const bracketParticipantInclude = Prisma.validator<Prisma.BracketParticipantInclude>()({
  player: {
    include: participantPlayerInclude
  }
});

const bracketMatchInclude = Prisma.validator<Prisma.BracketMatchInclude>()({
  player1: {
    include: bracketParticipantInclude
  },
  player2: {
    include: bracketParticipantInclude
  },
  winner: {
    include: bracketParticipantInclude
  },
  loser: {
    include: bracketParticipantInclude
  },
  nextMatch: {
    select: {
      id: true,
      round: true,
      matchNumber: true,
      phase: true
    }
  }
});

const tournamentListInclude = Prisma.validator<Prisma.TournamentInclude>()({
  club: {
    include: {
      city: true,
      country: true
    }
  },
  discipline: true,
  applications: {
    select: {
      id: true,
      status: true
    }
  },
  bracketParticipants: {
    select: {
      id: true
    }
  },
  bracketMatches: {
    select: {
      id: true,
      scheduledAt: true
    }
  }
});

const tournamentDetailInclude = Prisma.validator<Prisma.TournamentInclude>()({
  club: {
    include: {
      city: true,
      country: true
    }
  },
  discipline: true,
  applications: {
    include: {
      player: {
        include: participantPlayerInclude
      }
    }
  },
  bracketParticipants: {
    include: bracketParticipantInclude
  },
  bracketMatches: {
    include: bracketMatchInclude
  }
});

type TournamentListRecord = Prisma.TournamentGetPayload<{ include: typeof tournamentListInclude }>;
type TournamentDetailRecord = Prisma.TournamentGetPayload<{ include: typeof tournamentDetailInclude }>;
type TournamentListResponse = TournamentListRecord & TournamentComputedFields;
type TournamentDetailResponse = Omit<TournamentDetailRecord, "bracketParticipants" | "bracketMatches"> &
  TournamentDetailComputedFields;
type BracketParticipantRecord = Prisma.BracketParticipantGetPayload<{ include: typeof bracketParticipantInclude }>;
type BracketMatchRecord = Prisma.BracketMatchGetPayload<{ include: typeof bracketMatchInclude }>;
type PlayerRecord = Prisma.PlayerGetPayload<{ include: typeof participantPlayerInclude }>;

@Injectable()
export class TournamentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService
  ) {}

  async findAll(filters: {
    city?: string;
    status?: string;
    disciplineId?: string;
    discipline?: string;
  }): Promise<TournamentListResponse[]> {
    const status = this.toStatus(filters.status);
    const disciplineName = this.toDisciplineName(filters.discipline);

    const tournaments = await this.prisma.tournament.findMany({
      where: {
        status,
        disciplineId: filters.disciplineId,
        discipline: disciplineName
          ? { is: { name: disciplineName } }
          : { is: { name: { in: TOURNAMENT_DISCIPLINE_NAMES } } },
        club: {
          is: {
            deletedAt: null,
            city: filters.city ? { is: { name: filters.city } } : undefined
          }
        }
      },
      include: tournamentListInclude,
      orderBy: { startsAt: "asc" }
    });

    return tournaments
      .map((tournament) => this.serializeTournament(tournament))
      .sort((left, right) => this.tournamentSortWeight(left) - this.tournamentSortWeight(right));
  }

  async findOne(id: string): Promise<TournamentDetailResponse | null> {
    const tournament = await this.prisma.tournament.findFirst({
      where: {
        id,
        club: {
          is: {
            deletedAt: null
          }
        }
      },
      include: {
        ...tournamentDetailInclude,
        applications: {
          ...tournamentDetailInclude.applications,
          orderBy: { createdAt: "asc" }
        },
        bracketParticipants: {
          ...tournamentDetailInclude.bracketParticipants,
          orderBy: { seed: "asc" }
        },
        bracketMatches: {
          ...tournamentDetailInclude.bracketMatches,
          orderBy: [{ round: "asc" }, { matchNumber: "asc" }]
        }
      }
    });

    if (!tournament) {
      return null;
    }

    return this.serializeTournamentDetail(tournament);
  }

  async create(dto: CreateTournamentDto, actor: RequestUser) {
    const clubId = await this.resolveManagedClubId(dto.clubId, actor);
    await this.ensureTournamentDiscipline(dto.disciplineId);
    const bracketSystem = dto.bracketSystem ?? TournamentBracketSystem.SINGLE_ELIMINATION;
    const eventFormat = dto.eventFormat ?? TournamentFormat.INDIVIDUAL;
    const bracketFormat = this.toBracketFormat(dto.bracketFormat, bracketSystem);
    const tournamentType = dto.tournamentType ?? TournamentType.VISITOR;
    const participantSelectionMode = this.resolveParticipantSelectionMode(dto.participantSelectionMode, tournamentType);
    const minPlayerLevel = dto.minPlayerLevel ?? PlayerLevel.NOVICE;
    const maxPlayerLevel = dto.maxPlayerLevel ?? PlayerLevel.PRO;

    this.assertSupportedBracketSystem(bracketSystem);
    this.assertSupportedTournamentFormat(eventFormat);
    this.assertSupportedBracketFormat(bracketFormat);
    this.assertValidPlayerLevelRange(minPlayerLevel, maxPlayerLevel);

    const created = await this.prisma.tournament.create({
      data: {
        title: dto.title,
        disciplineId: dto.disciplineId,
        clubId,
        billiardKind: dto.billiardKind ?? BilliardKind.PYRAMID,
        category: dto.category ?? TournamentCategory.OPEN,
        tournamentLevel: dto.tournamentLevel ?? TournamentLevel.OPEN_TOURNAMENT,
        eventFormat,
        bracketSystem,
        participantSelectionMode,
        tournamentType,
        minPlayerLevel,
        maxPlayerLevel,
        repeatEveryDays: dto.repeatEveryDays ?? null,
        startsAt: new Date(dto.startsAt),
        prizePool: dto.prizePool,
        bracketSize: dto.bracketSize,
        bracketFormat,
        organizerId: actor.sub,
        status: dto.status ?? TournamentStatus.DRAFT,
        ...this.mapPublicContentInput(dto),
        ...this.mapRegulationInput(dto.regulation)
      }
    });

    await this.auditService.log({
      actor,
      action: "tournament.create",
      entityType: "tournament",
      entityId: created.id,
      metadata: {
        status: created.status,
        clubId: created.clubId,
        bracketSize: created.bracketSize
      }
    });

    return created;
  }

  async update(id: string, dto: UpdateTournamentDto, actor: RequestUser) {
    const tournament = await this.prisma.tournament.findUnique({
      where: { id },
      select: {
        id: true,
        organizerId: true,
        status: true,
        bracketSize: true,
        bracketFormat: true,
        bracketSystem: true,
        tournamentType: true,
        participantSelectionMode: true,
        minPlayerLevel: true,
        maxPlayerLevel: true,
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

    this.assertCanManageTournament(actor, tournament.organizerId);

    if (tournament.status === TournamentStatus.FINISHED) {
      throw new ForbiddenException("Finished tournament cannot be modified.");
    }

    if (dto.bracketSystem) {
      this.assertSupportedBracketSystem(dto.bracketSystem);
    }

    if (dto.eventFormat) {
      this.assertSupportedTournamentFormat(dto.eventFormat);
    }

    const requestedBracketFormat =
      dto.bracketFormat || dto.bracketSystem
        ? this.toBracketFormat(dto.bracketFormat, dto.bracketSystem ?? tournament.bracketSystem)
        : undefined;

    if (requestedBracketFormat) {
      this.assertSupportedBracketFormat(requestedBracketFormat);
    }

    const bracketGenerated = tournament._count.bracketMatches > 0;
    if (bracketGenerated) {
      const nextBracketFormat = requestedBracketFormat ?? tournament.bracketFormat;
      const nextBracketSystem = dto.bracketSystem ?? tournament.bracketSystem;
      const nextBracketSize = dto.bracketSize ?? tournament.bracketSize;

      if (dto.bracketFormat && nextBracketFormat !== tournament.bracketFormat) {
        throw new ForbiddenException("Bracket format cannot be changed after bracket generation.");
      }

      if (dto.bracketSystem && nextBracketSystem !== tournament.bracketSystem) {
        throw new ForbiddenException("Bracket system cannot be changed after bracket generation.");
      }

      if (dto.bracketSize && nextBracketSize !== tournament.bracketSize) {
        throw new ForbiddenException("Bracket size cannot be changed after bracket generation.");
      }
    }

    if (dto.bracketSize) {
      const approvedApplicationsCount = await this.prisma.application.count({
        where: {
          tournamentId: id,
          status: ApplicationStatus.APPROVED
        }
      });

      const currentPoolSize = Math.max(
        tournament._count.bracketParticipants,
        approvedApplicationsCount,
        dto.participants ?? 0
      );

      if (dto.bracketSize < currentPoolSize) {
        throw new ForbiddenException("Bracket size cannot be smaller than the current tournament pool.");
      }
    }

    if (dto.clubId) {
      await this.resolveManagedClubId(dto.clubId, actor);
    }

    if (dto.disciplineId) {
      await this.ensureTournamentDiscipline(dto.disciplineId);
    }

    const nextTournamentType = dto.tournamentType ?? tournament.tournamentType;
    const nextParticipantSelectionMode =
      dto.participantSelectionMode ??
      (dto.tournamentType ? this.resolveParticipantSelectionMode(undefined, nextTournamentType) : undefined);
    const nextMinPlayerLevel = dto.minPlayerLevel ?? tournament.minPlayerLevel;
    const nextMaxPlayerLevel = dto.maxPlayerLevel ?? tournament.maxPlayerLevel;
    this.assertValidPlayerLevelRange(nextMinPlayerLevel, nextMaxPlayerLevel);

    const updated = await this.prisma.tournament.update({
      where: { id },
      data: {
        title: dto.title,
        disciplineId: dto.disciplineId,
        clubId: dto.clubId,
        startsAt: dto.startsAt ? new Date(dto.startsAt) : undefined,
        prizePool: dto.prizePool,
        participants: dto.participants,
        bracketSize: dto.bracketSize,
        bracketFormat: requestedBracketFormat,
        billiardKind: dto.billiardKind,
        category: dto.category,
        tournamentLevel: dto.tournamentLevel,
        eventFormat: dto.eventFormat,
        bracketSystem: dto.bracketSystem,
        participantSelectionMode: nextParticipantSelectionMode,
        tournamentType: dto.tournamentType,
        minPlayerLevel: dto.minPlayerLevel,
        maxPlayerLevel: dto.maxPlayerLevel,
        repeatEveryDays: dto.repeatEveryDays,
        status: dto.status,
        ...this.mapPublicContentInput(dto),
        ...this.mapRegulationInput(dto.regulation)
      }
    });

    await this.auditService.log({
      actor,
      action: "tournament.update",
      entityType: "tournament",
      entityId: updated.id,
      metadata: {
        changedFields: Object.keys(dto)
      }
    });

    return updated;
  }

  async remove(id: string, actor: RequestUser) {
    const tournament = await this.prisma.tournament.findUnique({
      where: { id },
      select: {
        id: true,
        organizerId: true
      }
    });

    if (!tournament) {
      throw new NotFoundException("Tournament not found");
    }

    this.assertCanManageTournament(actor, tournament.organizerId);

    await this.prisma.$transaction([
      this.prisma.application.deleteMany({
        where: { tournamentId: id }
      }),
      this.prisma.match.deleteMany({
        where: { tournamentId: id }
      }),
      this.prisma.bracketMatch.deleteMany({
        where: { tournamentId: id }
      }),
      this.prisma.bracketParticipant.deleteMany({
        where: { tournamentId: id }
      }),
      this.prisma.tournament.delete({
        where: { id }
      })
    ]);

    return { id };
  }

  private serializeTournament(tournament: TournamentListRecord): TournamentListResponse {
    const participantsCount = this.getParticipantsCount(tournament);
    return {
      ...tournament,
      ...this.getComputedFields(tournament, participantsCount)
    };
  }

  private serializeTournamentDetail(tournament: TournamentDetailRecord): TournamentDetailResponse {
    const bracketType = this.toBracketType(tournament.bracketSystem);
    const fallbackPlayers = this.collectFallbackPlayers(tournament);
    const bracketParticipants = tournament.bracketParticipants;
    const participantSeedMap = new Map<string, number>();

    bracketParticipants.forEach((participant) => {
      participantSeedMap.set(participant.playerId ?? participant.id, participant.seed);
    });

    if (participantSeedMap.size === 0) {
      fallbackPlayers.forEach((player, index) => participantSeedMap.set(player.id, index + 1));
    }

    const matches = this.buildBracketMatches(tournament, participantSeedMap);
    const rounds = this.buildBracketRounds(matches, tournament.bracketSize ?? 0);
    const results = this.buildResults(bracketParticipants, fallbackPlayers, matches);
    const placements = new Map(results.map((result) => [result.player.id, result.placement]));
    const eliminatedIds = new Set(
      matches
        .map((match) => {
          const loser =
            match.playerA && match.playerB && match.winnerId
              ? [match.playerA.id, match.playerB.id].find((id) => id !== match.winnerId) ?? null
              : null;
          return loser;
        })
        .filter((value): value is string => Boolean(value))
    );

    const participantsList = bracketParticipants.length > 0
      ? bracketParticipants.map((participant) =>
          this.serializeTournamentParticipantFromBracket(participant, placements, eliminatedIds)
        )
      : fallbackPlayers.map((player, index) =>
          this.serializeTournamentParticipantFromPlayer(player, index + 1, placements, eliminatedIds)
        );

    const participantsCount = participantsList.length;
    const computedFields = this.getComputedFields(tournament, participantsCount, bracketType);

    return {
      ...tournament,
      ...computedFields,
      description: this.readLocalizedText(tournament.descriptionText) ?? this.buildDescription(tournament, participantsCount),
      bracketType,
      rounds,
      matches,
      participantsList,
      results,
      regulation: this.buildRegulation(tournament)
    };
  }

  private buildBracketMatches(
    tournament: TournamentDetailRecord,
    participantSeedMap: Map<string, number>
  ): TournamentBracketMatchDto[] {
    const matchNumberById = new Map(tournament.bracketMatches.map((match) => [match.id, match.matchNumber]));
    return tournament.bracketMatches.map((match) => {
      const phase = this.toMatchPhase(match.phase);
      const roundNumber = phase === "final" ? 1 : match.round;
      const loserTargetNumber = match.loserNextMatchId ? matchNumberById.get(match.loserNextMatchId) ?? null : null;

      return {
        id: match.id,
        matchNumber: match.matchNumber,
        roundNumber,
        roundKey: `${phase}-${roundNumber}`,
        phase,
        tableNumber: match.tableNumber ?? null,
        scheduledAt: (match.scheduledAt ?? tournament.startsAt).toISOString(),
        bestOf: match.bestOf,
        status: this.toMatchStatus(match.status),
        isBye: match.isBye,
        playerA: match.player1 ? this.serializeMatchPlayerFromParticipant(match.player1, participantSeedMap) : null,
        playerB: match.player2 ? this.serializeMatchPlayerFromParticipant(match.player2, participantSeedMap) : null,
        score: {
          a: match.player1Score ?? null,
          b: match.player2Score ?? null
        },
        winnerId: match.winner?.playerId ?? match.winnerId ?? null,
        winnerTo: match.nextMatch ? String(match.nextMatch.matchNumber) : null,
        loserTo: loserTargetNumber ? String(loserTargetNumber) : null,
        isThirdPlace: match.isThirdPlace,
        isFinalReset: match.isFinalReset,
        groupIndex: match.groupIndex ?? null
      };
    });
  }

  private buildBracketRounds(
    matches: TournamentBracketMatchDto[],
    bracketSize: number
  ): TournamentBracketRoundDto[] {
    if (matches.length === 0) {
      return [];
    }

    const maxUpperRound = matches
      .filter((match) => match.phase === "upper")
      .reduce((max, match) => Math.max(max, match.roundNumber), 0);

    const grouped = new Map<string, TournamentBracketRoundDto>();

    for (const match of matches) {
      const key = match.roundKey;
      const existing = grouped.get(key);
      if (existing) {
        existing.matches.push(match);
        continue;
      }

      grouped.set(key, {
        id: key,
        label: this.roundLabel(match.phase, match.roundNumber, maxUpperRound),
        phase: match.phase,
        roundNumber: match.roundNumber,
        // Lower-bracket rounds advertise the final place range they decide (e.g. "25-32").
        placeRange:
          match.phase === "lower" && bracketSize > 0 ? lowerRoundPlaceRange(bracketSize, match.roundNumber) : null,
        matches: [match]
      });
    }

    return [...grouped.values()].sort(
      (left, right) => this.roundSortWeight(left.phase, left.roundNumber) - this.roundSortWeight(right.phase, right.roundNumber)
    );
  }

  private buildResults(
    bracketParticipants: BracketParticipantRecord[],
    fallbackPlayers: PlayerRecord[],
    matches: TournamentBracketMatchDto[]
  ): TournamentResultDto[] {
    if (matches.length === 0) {
      return [];
    }

    const playersById = new Map<string, TournamentMatchPlayerDto>();

    bracketParticipants.forEach((participant) => {
      const player = this.serializeMatchPlayerFromParticipant(
        participant,
        new Map([[participant.playerId ?? participant.id, participant.seed]])
      );
      playersById.set(player.id, player);
    });

    fallbackPlayers.forEach((player, index) => {
      playersById.set(player.id, this.serializeMatchPlayerFromPlayer(player, index + 1));
    });

    const results: TournamentResultDto[] = [];
    const placedIds = new Set<string>();

    const pushPlace = (
      playerId: string | null | undefined,
      placement: number,
      placeLabel: string,
      label: string
    ) => {
      if (!playerId || placedIds.has(playerId)) {
        return;
      }
      const player = playersById.get(playerId);
      if (!player) {
        return;
      }
      results.push({ placement, placeLabel, label, player, rating: 0 });
      placedIds.add(playerId);
    };

    const otherPlayerId = (match: TournamentBracketMatchDto, excludeId: string | null) =>
      [match.playerA?.id, match.playerB?.id].find((id) => Boolean(id) && id !== excludeId) ?? null;

    // The decisive final is the grand-final reset (if it was played) otherwise the primary final.
    const finals = matches.filter((match) => match.phase === "final");
    const resetFinal = finals.find((match) => match.isFinalReset) ?? null;
    const primaryFinal = finals.find((match) => !match.isFinalReset && !match.isThirdPlace) ?? finals[0] ?? null;
    const bronze = finals.find((match) => match.isThirdPlace) ?? null;
    const decisiveFinal =
      resetFinal && resetFinal.status === "finished" && resetFinal.winnerId ? resetFinal : primaryFinal;
    const finalFinished = decisiveFinal?.status === "finished" && Boolean(decisiveFinal.winnerId);

    if (finalFinished && decisiveFinal?.winnerId) {
      pushPlace(decisiveFinal.winnerId, 1, "1", "winner");
      pushPlace(otherPlayerId(decisiveFinal, decisiveFinal.winnerId), 2, "2", "finalist");
    }

    if (bronze && bronze.status === "finished" && bronze.winnerId) {
      pushPlace(bronze.winnerId, 3, "3", "thirdPlace");
      pushPlace(otherPlayerId(bronze, bronze.winnerId), 4, "4", "fourthPlace");
    }

    if (!finalFinished) {
      return results.sort((left, right) => left.placement - right.placement);
    }

    // Remaining players ranked by elimination depth (a later loss earns a better place),
    // then grouped into tie ranges such as 5-8.
    const eliminationMatch = new Map<string, TournamentBracketMatchDto>();
    for (const match of matches) {
      if (match.status !== "finished" || match.isBye || !match.winnerId) {
        continue;
      }
      for (const id of [match.playerA?.id, match.playerB?.id]) {
        if (!id || id === match.winnerId) {
          continue;
        }
        const current = eliminationMatch.get(id);
        if (!current || match.matchNumber > current.matchNumber) {
          eliminationMatch.set(id, match);
        }
      }
    }

    const weightOf = (playerId: string) => {
      const match = eliminationMatch.get(playerId);
      return match ? this.roundSortWeight(match.phase, match.roundNumber) : -1;
    };

    const remaining = [...playersById.values()]
      .filter((player) => !placedIds.has(player.id))
      .sort(
        (left, right) =>
          weightOf(right.id) - weightOf(left.id) ||
          (eliminationMatch.get(right.id)?.matchNumber ?? -1) - (eliminationMatch.get(left.id)?.matchNumber ?? -1) ||
          (left.seed ?? 9999) - (right.seed ?? 9999)
      );

    let place = results.length + 1;
    let index = 0;
    while (index < remaining.length) {
      const groupKey = eliminationMatch.get(remaining[index].id)?.roundKey ?? "none";
      let end = index;
      while (end < remaining.length && (eliminationMatch.get(remaining[end].id)?.roundKey ?? "none") === groupKey) {
        end += 1;
      }
      const size = end - index;
      const placeLabel = size > 1 ? `${place}-${place + size - 1}` : `${place}`;
      for (let cursor = index; cursor < end; cursor += 1) {
        pushPlace(remaining[cursor].id, place, placeLabel, "participant");
      }
      place += size;
      index = end;
    }

    return results.sort((left, right) => left.placement - right.placement);
  }

  private serializeTournamentParticipantFromBracket(
    participant: BracketParticipantRecord,
    placements: Map<string, number>,
    eliminatedIds: Set<string>
  ): TournamentParticipantDto {
    const player = this.serializeMatchPlayerFromParticipant(
      participant,
      new Map([[participant.playerId ?? participant.id, participant.seed]])
    );
    const placement = placements.get(player.id) ?? null;

    return {
      ...player,
      seed: participant.seed,
      rating: participant.player?.elo ?? 0,
      wins: participant.player?.wins ?? 0,
      losses: participant.player?.losses ?? 0,
      status: this.participantStatus(placement, eliminatedIds.has(player.id)),
      placement
    };
  }

  private serializeTournamentParticipantFromPlayer(
    player: PlayerRecord,
    seed: number,
    placements: Map<string, number>,
    eliminatedIds: Set<string>
  ): TournamentParticipantDto {
    const serialized = this.serializeMatchPlayerFromPlayer(player, seed);
    const placement = placements.get(player.id) ?? null;

    return {
      ...serialized,
      seed,
      rating: player.elo,
      wins: player.wins,
      losses: player.losses,
      status: this.participantStatus(placement, eliminatedIds.has(player.id)),
      placement
    };
  }

  private participantStatus(placement: number | null, eliminated: boolean): TournamentParticipantStatus {
    if (placement === 1) {
      return "winner";
    }

    if (placement === 2) {
      return "finalist";
    }

    if (placement !== null && placement <= 4) {
      return "semifinalist";
    }

    if (eliminated) {
      return "eliminated";
    }

    return "active";
  }

  private collectFallbackPlayers(tournament: TournamentDetailRecord): PlayerRecord[] {
    const players = new Map<string, PlayerRecord>();

    tournament.applications
      .filter((application) => application.status === ApplicationStatus.APPROVED)
      .forEach((application) => {
        if (application.player) {
          players.set(application.player.id, application.player);
        }
      });

    return [...players.values()].sort((left, right) => right.elo - left.elo || left.fullName.localeCompare(right.fullName));
  }

  private serializeMatchPlayerFromParticipant(
    participant: BracketParticipantRecord,
    participantSeedMap: Map<string, number>
  ): TournamentMatchPlayerDto {
    const player = participant.player;
    const playerId = participant.playerId ?? participant.id;

    return {
      id: playerId,
      fullName: player?.fullName ?? participant.name,
      clubId: player?.clubId ?? null,
      clubName: player?.club?.name ?? null,
      cityKey: this.cityKeyFromName(player?.city?.name),
      countryKey: this.countryKeyFromCountry(player?.country),
      seed: participantSeedMap.get(playerId) ?? participant.seed
    };
  }

  private serializeMatchPlayerFromPlayer(player: PlayerRecord, seed: number): TournamentMatchPlayerDto {
    return {
      id: player.id,
      fullName: player.fullName,
      clubId: player.clubId ?? null,
      clubName: player.club?.name ?? null,
      cityKey: this.cityKeyFromName(player.city?.name),
      countryKey: this.countryKeyFromCountry(player.country),
      seed
    };
  }

  private getComputedFields(
    tournament: TournamentListRecord | TournamentDetailRecord,
    participantsCount: number,
    bracketType: TournamentBracketType = this.toBracketType(tournament.bracketSystem)
  ): TournamentComputedFields {
    const cityKey = this.cityKeyFromName(tournament.club?.city?.name);
    const countryKey = this.countryKeyFromCountry(tournament.club?.country);
    const discipline = this.localizedDiscipline(tournament.discipline?.name);

    return {
      cityKey,
      disciplineKey: this.disciplineKeyFromName(tournament.discipline?.name),
      disciplineName: tournament.discipline?.name ?? this.disciplineLabelFromName(tournament.discipline?.name),
      billiardKind: tournament.billiardKind,
      category: tournament.category,
      tournamentLevel: tournament.tournamentLevel,
      eventFormat: tournament.eventFormat,
      bracketSystem: tournament.bracketSystem,
      participantSelectionMode: tournament.participantSelectionMode,
      tournamentType: tournament.tournamentType,
      minPlayerLevel: tournament.minPlayerLevel,
      maxPlayerLevel: tournament.maxPlayerLevel,
      repeatEveryDays: tournament.repeatEveryDays,
      billiardKindLabel: labelForBilliardKind(tournament.billiardKind),
      categoryLabel: labelForTournamentCategory(tournament.category),
      tournamentLevelLabel: labelForTournamentLevel(tournament.tournamentLevel),
      eventFormatLabel: labelForTournamentFormat(tournament.eventFormat),
      bracketSystemLabel: labelForBracketSystem(tournament.bracketSystem),
      participantSelectionModeLabel: labelForParticipantSelectionMode(tournament.participantSelectionMode),
      tournamentTypeLabel: labelForTournamentType(tournament.tournamentType),
      minPlayerLevelLabel: labelForPlayerLevel(tournament.minPlayerLevel),
      maxPlayerLevelLabel: labelForPlayerLevel(tournament.maxPlayerLevel),
      subtitle: this.localizedText(
        `${tournament.club?.name ?? "Tournament club"} / ${discipline.ru}`,
        `${tournament.club?.name ?? "Tournament club"} / ${discipline.uz}`,
        `${tournament.club?.name ?? "Tournament club"} / ${discipline.en}`
      ),
      organizer: tournament.club?.name ?? null,
      registrationLabel: this.readLocalizedText(tournament.registrationLabelText) ?? this.registrationLabelForStatus(tournament.status),
      format: this.buildFormatLabel(bracketType, tournament.bracketSize ?? participantsCount),
      schedule: this.buildScheduleSummary(tournament),
      participantsCount,
      clubPreview: tournament.club
        ? {
            id: tournament.club.id,
            name: tournament.club.name,
            address: tournament.club.address,
            cityKey,
            countryKey
          }
        : null
    };
  }

  private buildDescription(tournament: TournamentDetailRecord, participantsCount: number): LocalizedTextDto {
    const clubName = tournament.club?.name ?? "the host club";
    const cityName = tournament.club?.city?.name ?? "Tashkent";
    const discipline = this.localizedDiscipline(tournament.discipline?.name);
    const prizePool = this.formatUzbekCurrency(tournament.prizePool);

    switch (tournament.status) {
      case TournamentStatus.DRAFT:
        return this.localizedText(
          `${tournament.title} готовится к публикации в ${clubName}, ${cityName}. Организатор собирает регламент, состав и параметры сетки.`,
          `${tournament.title} ${clubName}, ${cityName} uchun tayyorlanmoqda. Tashkilotchi reglament, tarkib va setka parametlarini yakunlamoqda.`,
          `${tournament.title} is being prepared for release at ${clubName} in ${cityName}. The organizer is finalizing regulation, lineup, and bracket settings.`
        );
      case TournamentStatus.REGISTRATION:
        return this.localizedText(
          `${tournament.title} пройдет в ${clubName}, ${cityName}. ${participantsCount} игроков, ${discipline.ru}, призовой фонд ${prizePool}. Регистрация уже открыта.`,
          `${tournament.title} ${clubName}, ${cityName} da o'tadi. ${participantsCount} o'yinchi, ${discipline.uz} va ${prizePool} mukofot jamg'armasi. Ro'yxat ochiq.`,
          `${tournament.title} will take place at ${clubName} in ${cityName}. ${participantsCount} players, ${discipline.en}, and a ${prizePool} prize pool. Registration is open.`
        );
      case TournamentStatus.FINISHED:
        return this.localizedText(
          `${tournament.title} завершен в ${clubName}, ${cityName}. Финальная сетка, участники и чемпион доступны на одной странице турнира.`,
          `${tournament.title} ${clubName}, ${cityName} da yakunlandi. Final setka, ishtirokchilar va chempion bitta turnir sahifasida jamlangan.`,
          `${tournament.title} has concluded at ${clubName} in ${cityName}. The final bracket, participants, and champion are collected on one tournament page.`
        );
      case TournamentStatus.LIVE:
        return this.localizedText(
          `${tournament.title} идет прямо сейчас в ${clubName}, ${cityName}. Живая сетка, столы и результаты обновляются по ходу матчей.`,
          `${tournament.title} ayni paytda ${clubName}, ${cityName} da davom etmoqda. Jonli setka, stollar va natijalar matchlar davomida yangilanadi.`,
          `${tournament.title} is live right now at ${clubName} in ${cityName}. The bracket, tables, and results update as matches unfold.`
        );
      default:
        return this.localizedText(
          `${tournament.title} пройдет в ${clubName}, ${cityName}. ${participantsCount} игроков, ${discipline.ru}, призовой фонд ${prizePool}.`,
          `${tournament.title} ${clubName}, ${cityName} da o'tadi. ${participantsCount} o'yinchi, ${discipline.uz} va ${prizePool} mukofot jamg'armasi.`,
          `${tournament.title} will take place at ${clubName} in ${cityName}. ${participantsCount} players, ${discipline.en}, and a ${prizePool} prize pool.`
        );
    }
  }

  private buildRegulation(tournament: TournamentDetailRecord): TournamentRegulationDto {
    const discipline = this.localizedDiscipline(tournament.discipline?.name);

    return {
      format:
        this.readLocalizedText(tournament.regulationFormat) ??
        this.buildFormatLabel(this.toBracketType(tournament.bracketSystem), tournament.bracketSize ?? 0),
      entryFee:
        this.readLocalizedText(tournament.regulationEntryFee) ??
        (tournament.prizePool > 0
          ? this.localizedText(
              `Призовой фонд: ${this.formatUzbekCurrency(tournament.prizePool)}`,
              `Mukofot jamg'armasi: ${this.formatUzbekCurrency(tournament.prizePool)}`,
              `Prize pool: ${this.formatUzbekCurrency(tournament.prizePool)}`
            )
          : this.localizedText("Участие бесплатное", "Ishtirok bepul", "Free entry")),
      participationTerms:
        this.readLocalizedArray(tournament.regulationParticipationTerms) ?? [
          this.localizedText(
            "В финальный посев попадают только подтвержденные участники.",
            "Yakuniy saralashga faqat tasdiqlangan ishtirokchilar kiradi.",
            "Only confirmed players are included in the final seeding."
          ),
          this.localizedText(
            "Игрок обязан отметиться до первого официального вызова.",
            "O'yinchi birinchi rasmiy chaqiruvdan oldin tasdiqlanishi kerak.",
            "Players must check in before the first official call."
          )
        ],
      restrictions:
        this.readLocalizedArray(tournament.regulationRestrictions) ?? [
          this.localizedText(
            "Опоздание может привести к техническому поражению.",
            "Kechikish texnik mag'lubiyatga olib kelishi mumkin.",
            "Late arrival may result in a technical loss."
          ),
          this.localizedText(
            "Неспортивное поведение может привести к дисквалификации.",
            "Sport etikasi buzilishi diskvalifikatsiyaga olib kelishi mumkin.",
            "Unsportsmanlike conduct may lead to disqualification."
          )
        ],
      notes:
        this.readLocalizedArray(tournament.regulationNotes) ?? [
          this.localizedText(
            `Клуб-хост: ${tournament.club?.name ?? "TBD"}.`,
            `Mezbon klub: ${tournament.club?.name ?? "TBD"}.`,
            `Host club: ${tournament.club?.name ?? "TBD"}.`
          ),
          this.localizedText(
            "Сетка, участники и результаты обновляются во время турнира.",
            "Setka, ishtirokchilar va natijalar turnir davomida yangilanadi.",
            "The bracket, participants, and results update during the event."
          )
        ],
      discipline
    };
  }

  private buildScheduleSummary(tournament: TournamentListRecord | TournamentDetailRecord): LocalizedTextDto[] | null {
    const scheduleSource = "bracketMatches" in tournament ? tournament.bracketMatches : [];
    if (!scheduleSource.length) {
      return null;
    }

    const scheduledMatches = scheduleSource
      .map((match) => match.scheduledAt)
      .filter((value): value is Date => Boolean(value))
      .sort((left, right) => left.getTime() - right.getTime());

    if (!scheduledMatches.length) {
      return null;
    }

    return [
      this.localizedText(
        `Первый вызов: ${scheduledMatches[0].toISOString()}`,
        `Birinchi chaqiruv: ${scheduledMatches[0].toISOString()}`,
        `Opening call: ${scheduledMatches[0].toISOString()}`
      ),
      this.localizedText(
        `Последний матч по плану: ${scheduledMatches[scheduledMatches.length - 1].toISOString()}`,
        `Rejadagi oxirgi match: ${scheduledMatches[scheduledMatches.length - 1].toISOString()}`,
        `Latest planned match: ${scheduledMatches[scheduledMatches.length - 1].toISOString()}`
      )
    ];
  }

  private getParticipantsCount(tournament: TournamentListRecord | TournamentDetailRecord): number {
    const approvedApplications = tournament.applications.filter(
      (application) => application.status === ApplicationStatus.APPROVED
    ).length;

    return Math.max(tournament.participants, tournament.bracketParticipants.length, approvedApplications);
  }

  private buildFormatLabel(bracketType: TournamentBracketType, bracketSize: number): LocalizedTextDto {
    const participantsRu = bracketSize > 0 ? `${bracketSize} участников` : "открытая сетка";
    const participantsUz = bracketSize > 0 ? `${bracketSize} ishtirokchi` : "ochiq setka";
    const participantsEn = bracketSize > 0 ? `${bracketSize} players` : "open bracket";

    switch (bracketType) {
      case "doubleElimination":
        return this.localizedText(
          `Double Elimination / ${participantsRu}`,
          `Double Elimination / ${participantsUz}`,
          `Double Elimination / ${participantsEn}`
        );
      case "roundRobin":
        return this.localizedText(
          `Round Robin / ${participantsRu}`,
          `Round Robin / ${participantsUz}`,
          `Round Robin / ${participantsEn}`
        );
      case "swiss":
        return this.localizedText(
          `Swiss / ${participantsRu}`,
          `Swiss / ${participantsUz}`,
          `Swiss / ${participantsEn}`
        );
      case "groupPlayoff":
        return this.localizedText(
          `Group + Playoff / ${participantsRu}`,
          `Group + Playoff / ${participantsUz}`,
          `Group + Playoff / ${participantsEn}`
        );
      default:
        return this.localizedText(
          `Single Elimination / ${participantsRu}`,
          `Single Elimination / ${participantsUz}`,
          `Single Elimination / ${participantsEn}`
        );
    }
  }

  private registrationLabelForStatus(status: TournamentStatus): LocalizedTextDto {
    switch (status) {
      case TournamentStatus.DRAFT:
        return this.localizedText("Скоро откроется регистрация", "Ro'yxat tez orada ochiladi", "Registration opens soon");
      case TournamentStatus.REGISTRATION:
        return this.localizedText("Регистрация открыта", "Ro'yxat ochiq", "Registration open");
      case TournamentStatus.LIVE:
        return this.localizedText("Регистрация закрыта, турнир идет", "Ro'yxat yopilgan, turnir davom etmoqda", "Registration closed, event in progress");
      case TournamentStatus.FINISHED:
        return this.localizedText("Турнир завершен", "Turnir yakunlangan", "Completed");
      default:
        return this.localizedText("Регистрация открыта", "Ro'yxat ochiq", "Open");
    }
  }

  private roundLabel(phase: TournamentMatchPhase, roundNumber: number, maxUpperRound: number): string {
    if (phase === "final") {
      return "Final";
    }

    if (phase === "lower") {
      return `Lower Round ${roundNumber}`;
    }

    const distanceToFinal = maxUpperRound + 1 - roundNumber;
    if (distanceToFinal <= 0) {
      return "Round";
    }

    const denominator = 2 ** distanceToFinal;
    if (denominator >= 2) {
      return `1/${denominator}`;
    }

    return `Round ${roundNumber}`;
  }

  private roundSortWeight(phase: TournamentMatchPhase, roundNumber: number) {
    const phaseWeight = phase === "upper" ? 100 : phase === "lower" ? 200 : 300;
    return phaseWeight + roundNumber;
  }

  private toBracketType(input: TournamentBracketSystem | BracketFormat): TournamentBracketType {
    if (input === "DOUBLE_ELIMINATION") {
      return "doubleElimination";
    }

    if (input === "ROUND_ROBIN") {
      return "roundRobin";
    }

    if (input === "SWISS") {
      return "swiss";
    }

    if (input === "GROUP_PLAYOFF") {
      return "groupPlayoff";
    }

    return "singleElimination";
  }

  private toBracketFormat(format?: string, bracketSystem?: TournamentBracketSystem): BracketFormat {
    if (format === BracketFormat.DOUBLE_ELIMINATION || bracketSystem === TournamentBracketSystem.DOUBLE_ELIMINATION) {
      return BracketFormat.DOUBLE_ELIMINATION;
    }

    return BracketFormat.SINGLE_ELIMINATION;
  }

  private resolveParticipantSelectionMode(
    requestedMode: ParticipantSelectionMode | undefined,
    tournamentType: TournamentType
  ) {
    if (requestedMode) {
      return requestedMode;
    }

    return tournamentType === TournamentType.PRO
      ? ParticipantSelectionMode.APPLICATIONS
      : ParticipantSelectionMode.DIRECT;
  }

  private assertValidPlayerLevelRange(minLevel: PlayerLevel, maxLevel: PlayerLevel) {
    if (playerLevelWeight[minLevel] > playerLevelWeight[maxLevel]) {
      throw new ForbiddenException("Tournament min level must not exceed max level.");
    }
  }

  private toMatchPhase(phase: BracketMatchPhase): TournamentMatchPhase {
    switch (phase) {
      case BracketMatchPhase.LOWER:
        return "lower";
      case BracketMatchPhase.FINAL:
        return "final";
      default:
        return "upper";
    }
  }

  private toMatchStatus(status: BracketMatchStatus): TournamentMatchStatus {
    switch (status) {
      case BracketMatchStatus.READY:
        return "ready";
      case BracketMatchStatus.LIVE:
        return "live";
      case BracketMatchStatus.FINISHED:
        return "finished";
      default:
        return "pending";
    }
  }

  private mapRegulationInput(regulation?: TournamentRegulationInputDto) {
    if (!regulation) {
      return {};
    }

    return {
      regulationFormat: regulation.format as unknown as Prisma.InputJsonValue,
      regulationEntryFee: regulation.entryFee as unknown as Prisma.InputJsonValue,
      regulationParticipationTerms: regulation.participationTerms as unknown as Prisma.InputJsonValue,
      regulationRestrictions: regulation.restrictions as unknown as Prisma.InputJsonValue,
      regulationNotes: regulation.notes as unknown as Prisma.InputJsonValue
    };
  }

  private mapPublicContentInput(input: {
    description?: LocalizedTextDto | null;
    registrationLabel?: LocalizedTextDto | null;
  }) {
    return {
      descriptionText:
        input.description === undefined
          ? undefined
          : input.description === null
            ? Prisma.DbNull
            : (input.description as unknown as Prisma.InputJsonValue),
      registrationLabelText:
        input.registrationLabel === undefined
          ? undefined
          : input.registrationLabel === null
            ? Prisma.DbNull
            : (input.registrationLabel as unknown as Prisma.InputJsonValue)
    };
  }

  private readLocalizedText(value: Prisma.JsonValue | null): LocalizedTextDto | null {
    if (!value || typeof value !== "object" || Array.isArray(value)) {
      return null;
    }

    const candidate = value as Record<string, unknown>;
    if (typeof candidate.ru !== "string" || typeof candidate.uz !== "string" || typeof candidate.en !== "string") {
      return null;
    }

    return {
      ru: candidate.ru,
      uz: candidate.uz,
      en: candidate.en
    };
  }

  private readLocalizedArray(value: Prisma.JsonValue | null): LocalizedTextDto[] | null {
    if (!Array.isArray(value)) {
      return null;
    }

    const items = value
      .map((item) => this.readLocalizedText(item as Prisma.JsonValue))
      .filter((item): item is LocalizedTextDto => Boolean(item));

    return items.length > 0 ? items : null;
  }

  private defaultLocalized(value: string): LocalizedTextDto {
    return this.localizedText(value, value, value);
  }

  private localizedDiscipline(disciplineName?: string | null): LocalizedTextDto {
    return tournamentDisciplineLabelFromName(disciplineName);
  }

  private disciplineLabelFromName(disciplineName?: string | null): string {
    return tournamentDisciplineLabelFromName(disciplineName).en;
  }

  private toStatus(status?: string): TournamentStatus | undefined {
    if (!status) {
      return undefined;
    }

    switch (status.toUpperCase()) {
      case "DRAFT":
        return TournamentStatus.DRAFT;
      case "REGISTRATION":
        return TournamentStatus.REGISTRATION;
      case "LIVE":
        return TournamentStatus.LIVE;
      case "FINISHED":
        return TournamentStatus.FINISHED;
      default:
        return undefined;
    }
  }

  private toDisciplineName(discipline?: string): string | undefined {
    if (!discipline) {
      return undefined;
    }

    return tournamentDisciplineNameFromInput(discipline);
  }

  private cityKeyFromName(cityName?: string | null): string {
    return cityKeyMap[this.normalizeValue(cityName)] ?? "tashkent";
  }

  private countryKeyFromCountry(country?: { code?: string | null; name?: string | null } | null): string {
    const codeKey = countryKeyMap[this.normalizeValue(country?.code)];
    const nameKey = countryKeyMap[this.normalizeValue(country?.name)];
    return codeKey ?? nameKey ?? "uzbekistan";
  }

  private disciplineKeyFromName(disciplineName?: string | null): string {
    return tournamentDisciplineKeyFromName(disciplineName);
  }

  private tournamentSortWeight(tournament: TournamentListResponse) {
    const statusWeight =
      tournament.status === TournamentStatus.LIVE
        ? 0
        : tournament.status === TournamentStatus.REGISTRATION
          ? 1
          : tournament.status === TournamentStatus.DRAFT
            ? 2
            : 3;
    const timestamp = new Date(tournament.startsAt).getTime();
    const direction = tournament.status === TournamentStatus.FINISHED ? -timestamp : timestamp;
    return statusWeight * 10_000_000_000_000 + direction;
  }

  private localizedText(ru: string, uz: string, en: string): LocalizedTextDto {
    return { ru, uz, en };
  }

  private formatUzbekCurrency(value: number) {
    return `${new Intl.NumberFormat("en-US").format(value)} UZS`;
  }

  private normalizeValue(value?: string | null): string {
    return (value ?? "").toLowerCase().replace(/[^a-z0-9]+/g, "");
  }

  private assertCanManageTournament(actor: RequestUser, organizerId: string) {
    if (actor.role === Role.ADMIN) {
      return;
    }

    if (actor.role === Role.ORGANIZER && actor.sub === organizerId) {
      return;
    }

    throw new ForbiddenException("Forbidden");
  }

  private async resolveManagedClubId(clubId: string, actor: RequestUser) {
    const club = await this.prisma.club.findUnique({
      where: { id: clubId },
      select: {
        id: true,
        userId: true,
        deletedAt: true
      }
    });

    if (!club || club.deletedAt) {
      throw new NotFoundException("Club not found");
    }

    if (actor.role === Role.ADMIN) {
      return club.id;
    }

    if (actor.role === Role.ORGANIZER) {
      return club.id;
    }

    throw new ForbiddenException("Forbidden");
  }

  private assertSupportedBracketSystem(value: TournamentBracketSystem) {
    if (!isActiveBracketSystem(value)) {
      throw new ForbiddenException("Only single elimination bracket is currently available.");
    }
  }

  private assertSupportedBracketFormat(value: BracketFormat) {
    if (value !== BracketFormat.SINGLE_ELIMINATION && value !== BracketFormat.DOUBLE_ELIMINATION) {
      throw new ForbiddenException("Unsupported bracket format.");
    }
  }

  private assertSupportedTournamentFormat(value: TournamentFormat) {
    if (!isActiveTournamentFormat(value)) {
      throw new ForbiddenException("Only individual tournament format is currently available.");
    }
  }

  private async ensureTournamentDiscipline(disciplineId: string) {
    const discipline = await this.prisma.discipline.findUnique({
      where: { id: disciplineId },
      select: {
        id: true,
        name: true
      }
    });

    if (!discipline || !isTournamentDisciplineName(discipline.name, { activeOnly: true })) {
      throw new ForbiddenException("Only free pyramid and Russian pyramid tournaments are allowed.");
    }
  }
}

