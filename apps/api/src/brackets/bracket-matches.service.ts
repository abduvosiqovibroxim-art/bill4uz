import { ForbiddenException, HttpStatus, Injectable } from "@nestjs/common";
import { Prisma, Role, TeamMemberStatus } from "@prisma/client";
import { RequestUser } from "../auth/dto";
import { PrismaService } from "../common/prisma.service";
import { BracketHttpException } from "./bracket.exception";
import {
  BracketMatchPhases,
  BracketMatchStatuses,
  BracketNextSlots,
  UpdateBracketResultInput,
  UpdateBracketStatusInput
} from "./bracket.types";

interface RollbackEntry {
  playerId: string;
  isWinner: boolean;
  eloDelta: number;
  mmrDelta: number;
  levelPointsDelta: number;
  winStreakBefore: number;
  bestWinStreakBefore: number;
}
import { BracketMatchProgressionService } from "./match-progression.service";
import { NotificationsService } from "../notifications/notifications.service";
import { AuditService } from "../platform/audit.service";
import { playerLevelFromPoints } from "../players/player-levels";
import {
  DEFAULT_ELO,
  DEFAULT_MMR,
  MIN_RATING,
  bumpWinStreak,
  computeElo,
  computeMmr,
  teamAverage
} from "../rating/rating.util";

const bracketMatchInclude = Prisma.validator<Prisma.BracketMatchInclude>()({
  player1: {
    include: {
      player: {
        include: {
          city: true,
          country: true,
          club: true
        }
      },
      team: {
        include: {
          members: {
            where: { status: TeamMemberStatus.ACTIVE },
            include: { player: { select: { id: true } } }
          }
        }
      }
    }
  },
  player2: {
    include: {
      player: {
        include: {
          city: true,
          country: true,
          club: true
        }
      },
      team: {
        include: {
          members: {
            where: { status: TeamMemberStatus.ACTIVE },
            include: { player: { select: { id: true } } }
          }
        }
      }
    }
  },
  winner: true,
  loser: true,
  nextMatch: {
    select: {
      id: true,
      round: true,
      matchNumber: true,
      phase: true
    }
  },
  previousMatches: {
    select: {
      id: true,
      round: true,
      matchNumber: true,
      status: true,
      winnerId: true,
      nextSlot: true
    }
  },
  tournament: {
    select: {
      id: true,
      disciplineId: true,
      organizerId: true,
      status: true
    }
  }
});

@Injectable()
export class BracketMatchesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly progressionService: BracketMatchProgressionService,
    private readonly notificationsService: NotificationsService,
    private readonly auditService: AuditService
  ) {}

  async getMatchById(id: string) {
    const match = await this.prisma.bracketMatch.findUnique({
      where: { id },
      include: bracketMatchInclude
    });

    if (!match) {
      throw new BracketHttpException(HttpStatus.NOT_FOUND, "Match not found.");
    }

    return match;
  }

  async updateMatchResult(id: string, input: UpdateBracketResultInput, actor: RequestUser) {
    const match = await this.getMatchById(id);
    this.assertCanManageTournament(actor, match.tournament.organizerId);

    if (match.isBye) {
      throw new BracketHttpException(HttpStatus.BAD_REQUEST, "Manual result entry is not allowed for BYE matches.");
    }

    if (match.status === BracketMatchStatuses.FINISHED) {
      throw new BracketHttpException(HttpStatus.CONFLICT, "Match result is already recorded.");
    }

    if (!match.player1Id || !match.player2Id) {
      throw new BracketHttpException(
        HttpStatus.BAD_REQUEST,
        "Result can be recorded only for matches with two participants."
      );
    }

    const resolvedWinnerId = resolveParticipantWinnerId(match, input.winnerId);
    const resolvedLoserId = resolvedWinnerId === match.player1Id ? match.player2Id : match.player1Id;
    validateScores(input, match, resolvedWinnerId);

    await this.prisma.bracketMatch.update({
      where: { id },
      data: {
        winnerId: resolvedWinnerId,
        loserId: resolvedLoserId,
        status: BracketMatchStatuses.FINISHED,
        isBye: false,
        player1Score: input.player1Score ?? null,
        player2Score: input.player2Score ?? null
      }
    });

    await this.applyMatchPoints(match, resolvedWinnerId);
    await this.progressionService.resolveTournamentProgression(match.tournamentId);
    await this.notificationsService.notifyMatchResult(match.id);
    await this.notificationsService.notifyTournamentCompletion(match.tournamentId);
    await this.auditService.log({
      actor,
      action: "match.result",
      entityType: "bracketMatch",
      entityId: match.id,
      metadata: {
        tournamentId: match.tournamentId,
        winnerId: resolvedWinnerId,
        player1Score: input.player1Score,
        player2Score: input.player2Score
      }
    });
    return this.getMatchById(id);
  }

  /** Roll back a finished match: exactly reverse the rating snapshot and unwind progression. */
  async rollbackMatch(id: string, actor: RequestUser) {
    const match = await this.getMatchById(id);
    this.assertCanManageTournament(actor, match.tournament.organizerId);

    if (match.status !== BracketMatchStatuses.FINISHED) {
      throw new BracketHttpException(HttpStatus.BAD_REQUEST, "Only a finished match can be rolled back.");
    }
    if (match.isBye) {
      throw new BracketHttpException(HttpStatus.BAD_REQUEST, "A BYE match cannot be rolled back.");
    }
    if (match.tournament.status === "FINISHED") {
      throw new BracketHttpException(
        HttpStatus.CONFLICT,
        "Tournament is already completed; roll back is not available after completion."
      );
    }

    const downstreamIds = [match.nextMatchId, match.loserNextMatchId].filter((value): value is string => Boolean(value));
    if (downstreamIds.length > 0) {
      const downstream = await this.prisma.bracketMatch.findMany({
        where: { id: { in: downstreamIds } },
        select: { id: true, status: true }
      });
      if (
        downstream.some(
          (item) => item.status === BracketMatchStatuses.LIVE || item.status === BracketMatchStatuses.FINISHED
        )
      ) {
        throw new BracketHttpException(
          HttpStatus.CONFLICT,
          "Cannot roll back: a following match has already started or finished."
        );
      }
    }

    // Double elimination: the grand-final reset is staged programmatically (not via
    // nextMatchId links), so treat it as a downstream of the primary final explicitly.
    const isPrimaryFinal =
      match.phase === BracketMatchPhases.FINAL && !match.isThirdPlace && !match.isFinalReset;
    const resetSibling = isPrimaryFinal
      ? await this.prisma.bracketMatch.findFirst({
          where: { tournamentId: match.tournamentId, isFinalReset: true },
          select: { id: true, status: true }
        })
      : null;
    if (
      resetSibling &&
      (resetSibling.status === BracketMatchStatuses.LIVE || resetSibling.status === BracketMatchStatuses.FINISHED)
    ) {
      throw new BracketHttpException(
        HttpStatus.CONFLICT,
        "Cannot roll back: the decisive final has already started or finished."
      );
    }

    const meta = (match.resultMeta as { entries?: RollbackEntry[] } | null)?.entries;
    if (!meta || meta.length === 0) {
      throw new BracketHttpException(
        HttpStatus.CONFLICT,
        "This result has no reversible snapshot and cannot be rolled back automatically."
      );
    }

    await this.prisma.$transaction(async (tx) => {
      for (const entry of meta) {
        const player = await tx.player.findUnique({
          where: { id: entry.playerId },
          select: { elo: true, mmr: true, levelPoints: true }
        });
        if (!player) {
          continue;
        }
        const elo = Math.max(MIN_RATING, (player.elo ?? DEFAULT_ELO) - entry.eloDelta);
        const mmr = Math.max(MIN_RATING, (player.mmr ?? DEFAULT_MMR) - entry.mmrDelta);
        const levelPoints = Math.max(0, (player.levelPoints ?? 0) - entry.levelPointsDelta);
        await tx.player.update({
          where: { id: entry.playerId },
          data: {
            elo,
            mmr,
            levelPoints,
            level: playerLevelFromPoints(levelPoints),
            winStreak: entry.winStreakBefore,
            bestWinStreak: entry.bestWinStreakBefore,
            ...(entry.isWinner ? { wins: { decrement: 1 } } : { losses: { decrement: 1 } })
          }
        });
        await this.reverseSeasonStats(tx, entry.playerId, entry.isWinner);
      }

      // Unwind progression: pull this match's winner/loser back out of their destination slots.
      if (match.nextMatchId && match.nextSlot) {
        await tx.bracketMatch.update({
          where: { id: match.nextMatchId },
          data: {
            [match.nextSlot === BracketNextSlots.PLAYER1 ? "player1Id" : "player2Id"]: null,
            status: BracketMatchStatuses.PENDING,
            winnerId: null,
            loserId: null
          }
        });
      }
      if (match.loserNextMatchId && match.loserNextSlot) {
        await tx.bracketMatch.update({
          where: { id: match.loserNextMatchId },
          data: {
            [match.loserNextSlot === BracketNextSlots.PLAYER1 ? "player1Id" : "player2Id"]: null,
            status: BracketMatchStatuses.PENDING,
            winnerId: null,
            loserId: null
          }
        });
      }

      // Clear a staged grand-final reset when rolling back the first final.
      if (resetSibling) {
        await tx.bracketMatch.update({
          where: { id: resetSibling.id },
          data: {
            player1Id: null,
            player2Id: null,
            status: BracketMatchStatuses.PENDING,
            winnerId: null,
            loserId: null,
            isBye: false
          }
        });
      }

      await tx.bracketMatch.update({
        where: { id },
        data: {
          winnerId: null,
          loserId: null,
          player1Score: null,
          player2Score: null,
          status: BracketMatchStatuses.READY,
          resultMeta: Prisma.DbNull
        }
      });
    });

    await this.progressionService.resolveTournamentProgression(match.tournamentId);
    await this.auditService.log({
      actor,
      action: "match.rollback",
      entityType: "bracketMatch",
      entityId: match.id,
      metadata: { tournamentId: match.tournamentId }
    });

    return this.getMatchById(id);
  }

  /** Override a finished match result: roll back, then record the corrected result. */
  async overrideMatchResult(id: string, input: UpdateBracketResultInput, actor: RequestUser) {
    await this.rollbackMatch(id, actor);
    return this.updateMatchResult(id, input, actor);
  }

  private async reverseSeasonStats(tx: Prisma.TransactionClient, playerId: string, wasWinner: boolean) {
    if (!("season" in tx) || !("playerSeasonStats" in tx) || !tx.season?.findFirst || !tx.playerSeasonStats?.updateMany) {
      return;
    }
    const season = await tx.season.findFirst({ where: { isActive: true }, orderBy: { startsAt: "desc" } });
    if (!season) {
      return;
    }
    await tx.playerSeasonStats.updateMany({
      where: { seasonId: season.id, playerId },
      data: {
        wins: { decrement: wasWinner ? 1 : 0 },
        losses: { decrement: wasWinner ? 0 : 1 },
        points: { decrement: wasWinner ? 3 : 0 }
      }
    });
  }

  async updateMatchStatus(id: string, input: UpdateBracketStatusInput, actor: RequestUser) {
    const match = await this.getMatchById(id);
    this.assertCanManageTournament(actor, match.tournament.organizerId);

    if (match.status === BracketMatchStatuses.FINISHED) {
      throw new BracketHttpException(HttpStatus.CONFLICT, "Finished match status cannot be changed.");
    }

    if (input.status === BracketMatchStatuses.FINISHED) {
      throw new BracketHttpException(
        HttpStatus.BAD_REQUEST,
        "Finished status must be reached through result submission, not direct status update."
      );
    }

    if (
      (input.status === BracketMatchStatuses.READY || input.status === BracketMatchStatuses.LIVE) &&
      (!match.player1Id || !match.player2Id)
    ) {
      throw new BracketHttpException(
        HttpStatus.BAD_REQUEST,
        "Match must have two participants to become ready or live."
      );
    }

    await this.prisma.bracketMatch.update({
      where: { id },
      data: {
        status: input.status
      }
    });

    await this.progressionService.refreshTournamentStatus(match.tournamentId);
    return this.getMatchById(id);
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

  private participantPlayerIds(
    participant:
      | {
          playerId?: string | null;
          teamId?: string | null;
          team?: { members?: Array<{ playerId: string; status: string }> } | null;
        }
      | null
      | undefined
  ): string[] {
    if (!participant) {
      return [];
    }
    if (participant.teamId && participant.team?.members?.length) {
      return participant.team.members
        .filter((member) => member.status === TeamMemberStatus.ACTIVE && Boolean(member.playerId))
        .map((member) => member.playerId);
    }
    return participant.playerId ? [participant.playerId] : [];
  }

  private async applyMatchPoints(
    match: Awaited<ReturnType<BracketMatchesService["getMatchById"]>>,
    winnerParticipantId: string
  ) {
    const prismaWithPlayer = this.prisma as unknown as {
      player?: {
        findUnique: (...args: unknown[]) => Promise<unknown>;
      };
    };

    if (!prismaWithPlayer.player?.findUnique) {
      return;
    }

    const winnerIsP1 = winnerParticipantId === match.player1Id;
    const winnerParticipant = winnerIsP1 ? match.player1 : match.player2;
    const loserParticipant = winnerIsP1 ? match.player2 : match.player1;

    // For 1v1 this is a single id each; for team matches it is the whole active roster.
    const winnerPlayerIds = this.participantPlayerIds(winnerParticipant);
    const loserPlayerIds = this.participantPlayerIds(loserParticipant);

    if (winnerPlayerIds.length === 0 || loserPlayerIds.length === 0) {
      return;
    }

    await this.prisma.$transaction(async (tx) => {
      const ratingSelect = {
        id: true,
        levelPoints: true,
        cityId: true,
        elo: true,
        mmr: true,
        wins: true,
        losses: true,
        winStreak: true,
        bestWinStreak: true
      } as const;

      const readPlayers = async (ids: string[]) => {
        const records: Array<{
          id: string;
          levelPoints: number;
          cityId: string;
          elo: number;
          mmr: number;
          wins: number;
          losses: number;
          winStreak: number;
          bestWinStreak: number;
        }> = [];
        for (const id of ids) {
          const player = await tx.player.findUnique({ where: { id }, select: ratingSelect });
          if (player) {
            records.push(player as (typeof records)[number]);
          }
        }
        return records;
      };

      const winners = await readPlayers(winnerPlayerIds);
      const losers = await readPlayers(loserPlayerIds);

      if (winners.length === 0 || losers.length === 0) {
        await tx.player.updateMany({ where: { id: { in: winnerPlayerIds } }, data: { wins: { increment: 1 } } });
        await tx.player.updateMany({ where: { id: { in: loserPlayerIds } }, data: { losses: { increment: 1 } } });
        return;
      }

      // Team rating uses the roster average vs the opponent roster average; the resulting
      // delta is applied to every member. For 1v1 the average is just the single player.
      const winnerAvgElo = teamAverage(winners.map((player) => player.elo ?? DEFAULT_ELO));
      const loserAvgElo = teamAverage(losers.map((player) => player.elo ?? DEFAULT_ELO));
      const winnerAvgMmr = teamAverage(winners.map((player) => player.mmr ?? DEFAULT_MMR), DEFAULT_MMR);
      const loserAvgMmr = teamAverage(losers.map((player) => player.mmr ?? DEFAULT_MMR), DEFAULT_MMR);
      const winnerAvgGames = teamAverage(winners.map((player) => (player.wins ?? 0) + (player.losses ?? 0)), 0);

      const elo = computeElo(winnerAvgElo, loserAvgElo, winnerAvgGames);
      const mmr = computeMmr(winnerAvgMmr, loserAvgMmr);

      // Snapshot of applied changes so the result can be rolled back exactly.
      const resultEntries: Array<{
        playerId: string;
        isWinner: boolean;
        eloDelta: number;
        mmrDelta: number;
        levelPointsDelta: number;
        winStreakBefore: number;
        bestWinStreakBefore: number;
      }> = [];

      for (const player of winners) {
        const nextPoints = player.levelPoints + 3;
        const streak = bumpWinStreak({ current: player.winStreak ?? 0, best: player.bestWinStreak ?? 0 });
        const newElo = Math.max(MIN_RATING, (player.elo ?? DEFAULT_ELO) + elo.winnerDelta);
        const newMmr = Math.max(MIN_RATING, (player.mmr ?? DEFAULT_MMR) + mmr.winnerDelta);
        await tx.player.update({
          where: { id: player.id },
          data: {
            wins: { increment: 1 },
            levelPoints: nextPoints,
            level: playerLevelFromPoints(nextPoints),
            elo: newElo,
            mmr: newMmr,
            winStreak: streak.current,
            bestWinStreak: streak.best
          }
        });
        await this.upsertRanking(tx, player.id, match.tournament.disciplineId, player.cityId, nextPoints);
        await this.upsertSeasonStats(tx, player.id, { isWinner: true, elo: newElo, mmr: newMmr });
        resultEntries.push({
          playerId: player.id,
          isWinner: true,
          eloDelta: newElo - (player.elo ?? DEFAULT_ELO),
          mmrDelta: newMmr - (player.mmr ?? DEFAULT_MMR),
          levelPointsDelta: 3,
          winStreakBefore: player.winStreak ?? 0,
          bestWinStreakBefore: player.bestWinStreak ?? 0
        });
      }

      for (const player of losers) {
        const newElo = Math.max(MIN_RATING, (player.elo ?? DEFAULT_ELO) + elo.loserDelta);
        const newMmr = Math.max(MIN_RATING, (player.mmr ?? DEFAULT_MMR) + mmr.loserDelta);
        await tx.player.update({
          where: { id: player.id },
          data: {
            losses: { increment: 1 },
            elo: newElo,
            mmr: newMmr,
            winStreak: 0
          }
        });
        await this.upsertSeasonStats(tx, player.id, { isWinner: false, elo: newElo, mmr: newMmr });
        resultEntries.push({
          playerId: player.id,
          isWinner: false,
          eloDelta: newElo - (player.elo ?? DEFAULT_ELO),
          mmrDelta: newMmr - (player.mmr ?? DEFAULT_MMR),
          levelPointsDelta: 0,
          winStreakBefore: player.winStreak ?? 0,
          bestWinStreakBefore: player.bestWinStreak ?? 0
        });
      }

      await tx.bracketMatch.update({
        where: { id: match.id },
        data: { resultMeta: { entries: resultEntries } as unknown as Prisma.InputJsonValue }
      });
    });
  }

  private async upsertSeasonStats(
    tx: Prisma.TransactionClient,
    playerId: string,
    result: { isWinner: boolean; elo: number; mmr: number }
  ) {
    if (!("season" in tx) || !("playerSeasonStats" in tx) || !tx.season?.findFirst || !tx.playerSeasonStats?.upsert) {
      return;
    }

    const season = await tx.season.findFirst({ where: { isActive: true }, orderBy: { startsAt: "desc" } });
    if (!season) {
      return;
    }

    await tx.playerSeasonStats.upsert({
      where: { seasonId_playerId: { seasonId: season.id, playerId } },
      update: {
        elo: result.elo,
        mmr: result.mmr,
        wins: { increment: result.isWinner ? 1 : 0 },
        losses: { increment: result.isWinner ? 0 : 1 },
        points: { increment: result.isWinner ? 3 : 0 }
      },
      create: {
        seasonId: season.id,
        playerId,
        elo: result.elo,
        mmr: result.mmr,
        wins: result.isWinner ? 1 : 0,
        losses: result.isWinner ? 0 : 1,
        points: result.isWinner ? 3 : 0
      }
    });
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
}

function resolveParticipantWinnerId(
  match: Awaited<ReturnType<BracketMatchesService["getMatchById"]>>,
  winnerId: string
) {
  if (winnerId === match.player1Id || winnerId === match.player1?.playerId) {
    return match.player1Id!;
  }

  if (winnerId === match.player2Id || winnerId === match.player2?.playerId) {
    return match.player2Id!;
  }

  throw new BracketHttpException(HttpStatus.BAD_REQUEST, "Winner must be one of the match participants.");
}

function validateScores(
  input: UpdateBracketResultInput,
  match: Awaited<ReturnType<BracketMatchesService["getMatchById"]>>,
  resolvedWinnerId: string
) {
  const hasPlayer1Score = typeof input.player1Score === "number";
  const hasPlayer2Score = typeof input.player2Score === "number";

  if (hasPlayer1Score !== hasPlayer2Score) {
    throw new BracketHttpException(HttpStatus.BAD_REQUEST, "Both player scores must be provided together.");
  }

  if (!hasPlayer1Score || !hasPlayer2Score) {
    throw new BracketHttpException(HttpStatus.BAD_REQUEST, "Both player scores must be provided together.");
  }

  if (input.player1Score === input.player2Score) {
    throw new BracketHttpException(HttpStatus.BAD_REQUEST, "Match scores cannot be equal.");
  }

  const expectedWinnerId = input.player1Score! > input.player2Score! ? match.player1Id! : match.player2Id!;
  if (resolvedWinnerId !== expectedWinnerId) {
    throw new BracketHttpException(HttpStatus.BAD_REQUEST, "Winner does not match the provided scores.");
  }
}
