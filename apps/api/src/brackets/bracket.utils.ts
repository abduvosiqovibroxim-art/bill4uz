import { randomUUID } from "node:crypto";
import { HttpStatus } from "@nestjs/common";
import { TournamentStatus } from "@prisma/client";
import { BracketHttpException } from "./bracket.exception";
import {
  BracketFormats,
  BracketMatchBlueprint,
  BracketMatchPhases,
  BracketMatchStatuses,
  BracketNextSlots
} from "./bracket.types";

export const SUPPORTED_BRACKET_SIZES = [4, 8, 16, 32, 64, 128] as const;

export function assertSupportedBracketSize(bracketSize: number | null | undefined) {
  if (!bracketSize || !SUPPORTED_BRACKET_SIZES.includes(bracketSize as (typeof SUPPORTED_BRACKET_SIZES)[number])) {
    throw new BracketHttpException(
      HttpStatus.BAD_REQUEST,
      `Unsupported bracket size. Allowed values: ${SUPPORTED_BRACKET_SIZES.join(", ")}.`
    );
  }
}

export function assertSingleElimination(format: string) {
  if (format !== BracketFormats.SINGLE_ELIMINATION) {
    throw new BracketHttpException(HttpStatus.BAD_REQUEST, "Double Elimination пока недоступна");
  }
}

export function assertTournamentMutable(status: TournamentStatus) {
  if (status === TournamentStatus.FINISHED) {
    throw new BracketHttpException(HttpStatus.CONFLICT, "Finished tournament cannot be modified.");
  }
}

export function getRoundCount(bracketSize: number) {
  return Math.log2(bracketSize);
}

export function getSeedOrder(bracketSize: number): number[] {
  assertSupportedBracketSize(bracketSize);

  let order = [1, 2];

  while (order.length < bracketSize) {
    const nextSize = order.length * 2;
    order = order.flatMap((seed) => [seed, nextSize + 1 - seed]);
  }

  return order;
}

export function getRoundLabel(bracketSize: number, round: number) {
  const roundsLeft = getRoundCount(bracketSize) - round;

  if (roundsLeft === 0) {
    return "Final";
  }

  if (roundsLeft === 1) {
    return "Semifinal";
  }

  if (roundsLeft === 2) {
    return "Quarterfinal";
  }

  return `Round ${round}`;
}

export function getInitialMatchState(player1Id: string | null, player2Id: string | null) {
  if (player1Id && player2Id) {
    return {
      winnerId: null,
      status: BracketMatchStatuses.READY,
      isBye: false
    };
  }

  if (player1Id || player2Id) {
    return {
      winnerId: player1Id ?? player2Id,
      status: BracketMatchStatuses.FINISHED,
      isBye: true
    };
  }

  return {
    winnerId: null,
    status: BracketMatchStatuses.FINISHED,
    isBye: true
  };
}

export const ROUND_ROBIN_MIN = 3;
export const ROUND_ROBIN_MAX = 24;

/**
 * Round Robin: every participant plays every other exactly once (single round robin),
 * scheduled with the standard circle method. Odd rosters get a rotating BYE (no match).
 * Matches have no winner/loser progression — placement comes from the standings table.
 */
export function buildRoundRobinBlueprints(
  tournamentId: string,
  participantIds: string[],
  options: { startsAt: Date; tableCount: number; bestOf?: number }
): BracketMatchBlueprint[] {
  if (participantIds.length < ROUND_ROBIN_MIN) {
    throw new BracketHttpException(HttpStatus.BAD_REQUEST, `Round robin needs at least ${ROUND_ROBIN_MIN} participants.`);
  }
  if (participantIds.length > ROUND_ROBIN_MAX) {
    throw new BracketHttpException(HttpStatus.BAD_REQUEST, `Round robin supports up to ${ROUND_ROBIN_MAX} participants.`);
  }

  const slots: Array<string | null> = [...participantIds];
  if (slots.length % 2 === 1) {
    slots.push(null); // BYE marker
  }

  const size = slots.length;
  const rounds = size - 1;
  const half = size / 2;
  const bestOf = options.bestOf ?? 3;
  const tableCount = Math.max(options.tableCount, 1);

  const matches: BracketMatchBlueprint[] = [];
  let matchNumber = 1;
  let rotation = [...slots];

  for (let round = 1; round <= rounds; round += 1) {
    for (let pair = 0; pair < half; pair += 1) {
      const home = rotation[pair];
      const away = rotation[size - 1 - pair];
      if (home === null || away === null) {
        continue; // BYE — no match this round
      }

      matches.push({
        id: randomUUID(),
        tournamentId,
        round,
        matchNumber: matchNumber++,
        phase: BracketMatchPhases.UPPER,
        player1Id: home,
        player2Id: away,
        winnerId: null,
        loserId: null,
        status: BracketMatchStatuses.READY,
        scheduledAt: addMinutes(options.startsAt, (round - 1) * 60),
        tableNumber: (pair % tableCount) + 1,
        bestOf,
        isBye: false,
        isThirdPlace: false,
        groupIndex: null,
        nextMatchId: null,
        nextSlot: null,
        loserNextMatchId: null,
        loserNextSlot: null,
        player1Score: null,
        player2Score: null
      });
    }

    // Circle method rotation: first slot fixed, the rest rotate clockwise.
    rotation = [rotation[0], rotation[size - 1], ...rotation.slice(1, size - 1)];
  }

  return matches;
}

export const SWISS_MIN = 4;
export const SWISS_MAX = 64;

/** Number of Swiss rounds for a given field size (standard ceil(log2(N))). */
export function swissRoundTarget(participantCount: number): number {
  if (participantCount < 2) {
    return 0;
  }
  return Math.max(1, Math.ceil(Math.log2(participantCount)));
}

export interface SwissStanding {
  participantId: string;
  seed: number;
  score: number;
}

export function swissPairKey(a: string, b: string): string {
  return [a, b].sort().join("|");
}

export interface SwissPairing {
  home: string;
  away: string | null; // null => BYE
}

/**
 * Pair a Swiss round: sort by score (then seed), greedily pair adjacent players who have
 * not met yet (falling back to a rematch only if unavoidable). Odd fields give a BYE to the
 * lowest-ranked player that has not had one.
 */
export function pairSwissRound(
  standings: SwissStanding[],
  playedPairs: Set<string>,
  hadBye: Set<string>
): SwissPairing[] {
  const ordered = [...standings].sort((a, b) => b.score - a.score || a.seed - b.seed);

  let byePlayer: string | null = null;
  if (ordered.length % 2 === 1) {
    for (let i = ordered.length - 1; i >= 0; i -= 1) {
      if (!hadBye.has(ordered[i].participantId)) {
        byePlayer = ordered[i].participantId;
        break;
      }
    }
    if (!byePlayer) {
      byePlayer = ordered[ordered.length - 1].participantId;
    }
  }

  const pool = ordered.filter((entry) => entry.participantId !== byePlayer);
  const used = new Set<string>();
  const pairings: SwissPairing[] = [];

  for (let i = 0; i < pool.length; i += 1) {
    const home = pool[i];
    if (used.has(home.participantId)) {
      continue;
    }

    let partnerIndex = -1;
    for (let j = i + 1; j < pool.length; j += 1) {
      const candidate = pool[j];
      if (used.has(candidate.participantId)) {
        continue;
      }
      if (!playedPairs.has(swissPairKey(home.participantId, candidate.participantId))) {
        partnerIndex = j;
        break;
      }
    }

    if (partnerIndex === -1) {
      for (let j = i + 1; j < pool.length; j += 1) {
        if (!used.has(pool[j].participantId)) {
          partnerIndex = j;
          break;
        }
      }
    }

    if (partnerIndex === -1) {
      continue;
    }

    const away = pool[partnerIndex];
    used.add(home.participantId);
    used.add(away.participantId);
    pairings.push({ home: home.participantId, away: away.participantId });
  }

  if (byePlayer) {
    pairings.push({ home: byePlayer, away: null });
  }

  return pairings;
}

/** First Swiss round: split the seeded field (top half vs bottom half). */
export function swissRoundOnePairings(participantIds: string[]): SwissPairing[] {
  const standings = participantIds.map((id, index) => ({ participantId: id, seed: index + 1, score: 0 }));
  if (participantIds.length % 2 === 0) {
    const half = participantIds.length / 2;
    const pairings: SwissPairing[] = [];
    for (let i = 0; i < half; i += 1) {
      pairings.push({ home: participantIds[i], away: participantIds[i + half] });
    }
    return pairings;
  }
  // Odd field: fall back to the generic pairer (handles the BYE).
  return pairSwissRound(standings, new Set(), new Set());
}

/** Materialise Swiss pairings into match blueprints for a given round. */
export function buildSwissRoundBlueprints(
  tournamentId: string,
  round: number,
  pairings: SwissPairing[],
  options: { startsAt: Date; tableCount: number; startMatchNumber: number; bestOf?: number }
): BracketMatchBlueprint[] {
  const tableCount = Math.max(options.tableCount, 1);
  let matchNumber = options.startMatchNumber;

  return pairings.map((pairing, index) => {
    const isBye = pairing.away === null;
    return {
      id: randomUUID(),
      tournamentId,
      round,
      matchNumber: matchNumber++,
      phase: BracketMatchPhases.UPPER,
      player1Id: pairing.home,
      player2Id: pairing.away,
      winnerId: isBye ? pairing.home : null,
      loserId: null,
      status: isBye ? BracketMatchStatuses.FINISHED : BracketMatchStatuses.READY,
      scheduledAt: addMinutes(options.startsAt, (round - 1) * 60),
      tableNumber: (index % tableCount) + 1,
      bestOf: options.bestOf ?? 3,
      isBye,
      isThirdPlace: false,
      groupIndex: null,
      nextMatchId: null,
      nextSlot: null,
      loserNextMatchId: null,
      loserNextSlot: null,
      player1Score: null,
      player2Score: null
    } satisfies BracketMatchBlueprint;
  });
}

export const GROUP_PLAYOFF_GROUP_SIZE = 4;
export const GROUP_PLAYOFF_ADVANCE = 2;
export const GROUP_PLAYOFF_MIN = 6;
export const GROUP_PLAYOFF_MAX = 64;

/** Distribute the seeded field across groups in a balanced round-robin fashion. */
export function assignGroups(participantIds: string[], groupSize = GROUP_PLAYOFF_GROUP_SIZE): string[][] {
  const groupCount = Math.max(1, Math.ceil(participantIds.length / groupSize));
  const groups: string[][] = Array.from({ length: groupCount }, () => []);
  participantIds.forEach((id, index) => {
    groups[index % groupCount].push(id);
  });
  return groups;
}

/** Round-robin matches within every group (circle method), tagged with their group index. */
export function buildGroupStageBlueprints(
  tournamentId: string,
  groups: string[][],
  options: { startsAt: Date; tableCount: number; bestOf?: number }
): BracketMatchBlueprint[] {
  const tableCount = Math.max(options.tableCount, 1);
  const bestOf = options.bestOf ?? 3;
  const matches: BracketMatchBlueprint[] = [];
  let matchNumber = 1;

  groups.forEach((groupIds, groupIndex) => {
    const slots: Array<string | null> = [...groupIds];
    if (slots.length % 2 === 1) {
      slots.push(null);
    }
    const size = slots.length;
    const rounds = size - 1;
    const half = size / 2;
    let rotation = [...slots];

    for (let round = 1; round <= rounds; round += 1) {
      for (let pair = 0; pair < half; pair += 1) {
        const home = rotation[pair];
        const away = rotation[size - 1 - pair];
        if (home === null || away === null) {
          continue;
        }
        matches.push({
          id: randomUUID(),
          tournamentId,
          round,
          matchNumber: matchNumber++,
          phase: BracketMatchPhases.UPPER,
          player1Id: home,
          player2Id: away,
          winnerId: null,
          loserId: null,
          status: BracketMatchStatuses.READY,
          scheduledAt: addMinutes(options.startsAt, (round - 1) * 60),
          tableNumber: (pair % tableCount) + 1,
          bestOf,
          isBye: false,
          isThirdPlace: false,
          groupIndex,
          nextMatchId: null,
          nextSlot: null,
          loserNextMatchId: null,
          loserNextSlot: null,
          player1Score: null,
          player2Score: null
        });
      }
      rotation = [rotation[0], rotation[size - 1], ...rotation.slice(1, size - 1)];
    }
  });

  return matches;
}

/**
 * Cross-group playoff seeding: group winners take the top seeds (in group order),
 * runners-up the next band, etc. Combined with standard bracket seeding this keeps
 * same-group qualifiers apart until the final.
 */
export function selectPlayoffSeedOrder(groupRankings: string[][], advance: number): string[] {
  const order: string[] = [];
  for (let rank = 0; rank < advance; rank += 1) {
    for (const group of groupRankings) {
      if (group[rank]) {
        order.push(group[rank]);
      }
    }
  }
  return order;
}

export function nextPlayoffSize(qualifierCount: number): number {
  let size = 1;
  while (size < qualifierCount) {
    size *= 2;
  }
  return Math.max(4, size);
}

export function buildMatchBlueprints(
  tournamentId: string,
  bracketSize: number,
  participantIdsBySeed: Map<number, string>,
  options: { startsAt: Date; tableCount: number }
): BracketMatchBlueprint[] {
  const rounds = getRoundCount(bracketSize);
  const matchMatrix: BracketMatchBlueprint[][] = [];
  let nextMatchNumber = 1;

  for (let round = 1; round <= rounds; round += 1) {
    const matchesInRound = bracketSize / 2 ** round;
    const matches = Array.from({ length: matchesInRound }, () => ({
      id: randomUUID(),
      tournamentId,
      round,
      matchNumber: nextMatchNumber++,
      phase: round === rounds ? BracketMatchPhases.FINAL : BracketMatchPhases.UPPER,
      player1Id: null,
      player2Id: null,
      winnerId: null,
      loserId: null,
      status: BracketMatchStatuses.PENDING,
      scheduledAt: null,
      tableNumber: null,
      bestOf: bestOfForRound(round, rounds),
      isBye: false,
      isThirdPlace: false,
      groupIndex: null,
      nextMatchId: null,
      nextSlot: null,
      loserNextMatchId: null,
      loserNextSlot: null,
      player1Score: null,
      player2Score: null
    } satisfies BracketMatchBlueprint));

    matchMatrix.push(matches);
  }

  for (let roundIndex = 0; roundIndex < matchMatrix.length - 1; roundIndex += 1) {
    const roundMatches = matchMatrix[roundIndex];
    const nextRoundMatches = matchMatrix[roundIndex + 1];

    roundMatches.forEach((match, matchIndex) => {
      const targetMatch = nextRoundMatches[Math.floor(matchIndex / 2)];
      match.nextMatchId = targetMatch.id;
      match.nextSlot = matchIndex % 2 === 0 ? BracketNextSlots.PLAYER1 : BracketNextSlots.PLAYER2;
    });
  }

  // 3rd place (bronze) match: semifinal losers meet for 3rd place.
  let bronzeMatch: BracketMatchBlueprint | null = null;
  if (rounds >= 2) {
    bronzeMatch = {
      id: randomUUID(),
      tournamentId,
      round: rounds,
      matchNumber: nextMatchNumber++,
      phase: BracketMatchPhases.FINAL,
      player1Id: null,
      player2Id: null,
      winnerId: null,
      loserId: null,
      status: BracketMatchStatuses.PENDING,
      scheduledAt: null,
      tableNumber: null,
      bestOf: 5,
      isBye: false,
      isThirdPlace: true,
      groupIndex: null,
      nextMatchId: null,
      nextSlot: null,
      loserNextMatchId: null,
      loserNextSlot: null,
      player1Score: null,
      player2Score: null
    } satisfies BracketMatchBlueprint;

    const semifinals = matchMatrix[rounds - 2];
    semifinals.forEach((semi, index) => {
      semi.loserNextMatchId = bronzeMatch!.id;
      semi.loserNextSlot = index % 2 === 0 ? BracketNextSlots.PLAYER1 : BracketNextSlots.PLAYER2;
    });
  }

  const firstRoundMatches = matchMatrix[0];
  const seededSlots = getSeedOrder(bracketSize).map((seed) => participantIdsBySeed.get(seed) ?? null);

  firstRoundMatches.forEach((match, index) => {
    const player1Id = seededSlots[index * 2] ?? null;
    const player2Id = seededSlots[index * 2 + 1] ?? null;
    const initialState = getInitialMatchState(player1Id, player2Id);

    match.player1Id = player1Id;
    match.player2Id = player2Id;
    match.winnerId = initialState.winnerId;
    match.loserId = null;
    match.status = initialState.status;
    match.isBye = initialState.isBye;
  });

  for (const roundMatches of matchMatrix) {
    roundMatches.forEach((match, index) => {
      const slot = Math.floor(index / Math.max(options.tableCount, 1));
      match.tableNumber = (index % Math.max(options.tableCount, 1)) + 1;
      match.scheduledAt = addMinutes(options.startsAt, (match.round - 1) * 90 + slot * 25);
    });
  }

  if (bronzeMatch) {
    // Schedule the bronze match just before the grand final on the first table.
    bronzeMatch.tableNumber = 1;
    bronzeMatch.scheduledAt = addMinutes(options.startsAt, (rounds - 1) * 90 - 30);
    return [...matchMatrix.flat(), bronzeMatch];
  }

  return matchMatrix.flat();
}

/**
 * Double Elimination bracket.
 *
 * Layout:
 *  - Winners Bracket (WB): rounds 1..W (phase UPPER), identical to single elimination.
 *  - Losers Bracket (LB): rounds 1..2(W-1) (phase LOWER). Alternating structure:
 *      LB R1            : two WB-R1 losers meet.
 *      LB R(2m)  (major): winner of LB R(2m-1) vs loser of WB R(m+1).
 *      LB R(2m+1)(minor): two LB R(2m) winners meet.
 *  - Grand Final (GF): round 2W-1 (phase FINAL) — WB winner vs LB winner (single final, no reset).
 *
 * Winner progression uses nextMatchId/nextSlot; WB losers drop into the LB via
 * loserNextMatchId/loserNextSlot. The progression engine resolves everything,
 * including BYEs, from these links.
 */
export function buildDoubleEliminationBlueprints(
  tournamentId: string,
  bracketSize: number,
  participantIdsBySeed: Map<number, string>,
  options: { startsAt: Date; tableCount: number }
): BracketMatchBlueprint[] {
  assertSupportedBracketSize(bracketSize);
  const W = getRoundCount(bracketSize);

  if (W < 2) {
    throw new BracketHttpException(
      HttpStatus.BAD_REQUEST,
      "Double Elimination requires a bracket size of at least 4."
    );
  }

  let nextMatchNumber = 1;
  const make = (round: number, phase: BracketMatchBlueprint["phase"], bestOf: number): BracketMatchBlueprint => ({
    id: randomUUID(),
    tournamentId,
    round,
    matchNumber: nextMatchNumber++,
    phase,
    player1Id: null,
    player2Id: null,
    winnerId: null,
    loserId: null,
    status: BracketMatchStatuses.PENDING,
    scheduledAt: null,
    tableNumber: null,
    bestOf,
    isBye: false,
    isThirdPlace: false,
    groupIndex: null,
    nextMatchId: null,
    nextSlot: null,
    loserNextMatchId: null,
    loserNextSlot: null,
    player1Score: null,
    player2Score: null
  });

  // --- Winners bracket ---
  const wb: BracketMatchBlueprint[][] = [];
  for (let round = 1; round <= W; round += 1) {
    const count = bracketSize / 2 ** round;
    wb.push(Array.from({ length: count }, () => make(round, BracketMatchPhases.UPPER, bestOfForRound(round, W))));
  }

  // WB winner progression (towards WB final).
  for (let roundIndex = 0; roundIndex < wb.length - 1; roundIndex += 1) {
    wb[roundIndex].forEach((match, matchIndex) => {
      const target = wb[roundIndex + 1][Math.floor(matchIndex / 2)];
      match.nextMatchId = target.id;
      match.nextSlot = matchIndex % 2 === 0 ? BracketNextSlots.PLAYER1 : BracketNextSlots.PLAYER2;
    });
  }

  // --- Losers bracket ---
  const lbRoundCount = 2 * (W - 1);
  const lb: BracketMatchBlueprint[][] = [];
  for (let round = 1; round <= lbRoundCount; round += 1) {
    const count = losersRoundMatchCount(bracketSize, round);
    const isLowerFinal = round === lbRoundCount;
    lb.push(Array.from({ length: count }, () => make(round, BracketMatchPhases.LOWER, isLowerFinal ? 5 : 3)));
  }

  // LB internal winner progression.
  for (let roundIndex = 0; roundIndex < lb.length - 1; roundIndex += 1) {
    const current = lb[roundIndex];
    const next = lb[roundIndex + 1];
    const isMinorToMajor = (roundIndex + 1) % 2 === 1; // odd LB round (1-based) -> 1:1 into next major round
    current.forEach((match, matchIndex) => {
      if (isMinorToMajor) {
        match.nextMatchId = next[matchIndex].id;
        match.nextSlot = BracketNextSlots.PLAYER1;
      } else {
        match.nextMatchId = next[Math.floor(matchIndex / 2)].id;
        match.nextSlot = matchIndex % 2 === 0 ? BracketNextSlots.PLAYER1 : BracketNextSlots.PLAYER2;
      }
    });
  }

  // --- Grand final ---
  const grandFinal = make(lbRoundCount + 1, BracketMatchPhases.FINAL, 7);
  wb[W - 1][0].nextMatchId = grandFinal.id;
  wb[W - 1][0].nextSlot = BracketNextSlots.PLAYER1;
  lb[lbRoundCount - 1][0].nextMatchId = grandFinal.id;
  lb[lbRoundCount - 1][0].nextSlot = BracketNextSlots.PLAYER2;

  // --- Drop WB losers into the losers bracket ---
  // WB round 1 losers: two per LB round 1 match.
  wb[0].forEach((match, matchIndex) => {
    const target = lb[0][Math.floor(matchIndex / 2)];
    match.loserNextMatchId = target.id;
    match.loserNextSlot = matchIndex % 2 === 0 ? BracketNextSlots.PLAYER1 : BracketNextSlots.PLAYER2;
  });
  // WB round k (k>=2) losers: into LB major round 2(k-1), PLAYER2 slot.
  for (let k = 2; k <= W; k += 1) {
    const lbMajorRoundIndex = 2 * (k - 1) - 1; // 0-based index of LB round 2(k-1)
    wb[k - 1].forEach((match, matchIndex) => {
      const target = lb[lbMajorRoundIndex][matchIndex];
      match.loserNextMatchId = target.id;
      match.loserNextSlot = BracketNextSlots.PLAYER2;
    });
  }

  // --- Seed WB round 1 (same seeding as single elimination) ---
  const seededSlots = getSeedOrder(bracketSize).map((seed) => participantIdsBySeed.get(seed) ?? null);
  wb[0].forEach((match, index) => {
    const player1Id = seededSlots[index * 2] ?? null;
    const player2Id = seededSlots[index * 2 + 1] ?? null;
    const initialState = getInitialMatchState(player1Id, player2Id);
    match.player1Id = player1Id;
    match.player2Id = player2Id;
    match.winnerId = initialState.winnerId;
    match.status = initialState.status;
    match.isBye = initialState.isBye;
  });

  // --- Scheduling: WB by round, LB staggered after, GF last ---
  const all = [...wb.flat(), ...lb.flat(), grandFinal];
  const tableCount = Math.max(options.tableCount, 1);
  let placed = 0;
  for (const match of all) {
    match.tableNumber = (placed % tableCount) + 1;
    const phaseOffset = match.phase === BracketMatchPhases.LOWER ? 45 : 0;
    match.scheduledAt = addMinutes(options.startsAt, (match.round - 1) * 90 + phaseOffset + Math.floor(placed / tableCount) * 5);
    placed += 1;
  }

  return all;
}

/** Match count for a 1-based losers-bracket round of a double elimination bracket. */
function losersRoundMatchCount(bracketSize: number, round: number): number {
  if (round === 1) {
    return bracketSize / 4;
  }
  if (round % 2 === 0) {
    const m = round / 2;
    return bracketSize / 2 ** (m + 1);
  }
  const m = (round - 1) / 2;
  return bracketSize / 2 ** (m + 2);
}

function bestOfForRound(round: number, totalRounds: number) {
  if (round === totalRounds) {
    return 7;
  }

  if (round >= totalRounds - 1) {
    return 5;
  }

  return 3;
}

function addMinutes(base: Date, minutes: number) {
  return new Date(base.getTime() + minutes * 60 * 1000);
}
