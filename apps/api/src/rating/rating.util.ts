/**
 * Pure rating math for the competitive ladder.
 *
 * - ELO is the public, lifetime "skill" rating shown on profiles and global ranking.
 * - MMR is the internal matchmaking rating; it moves faster early and is used for
 *   pairing / seeding suggestions. Both use the standard Elo expectation formula
 *   with different K-factors.
 *
 * The functions here are deterministic and side-effect free so they can be unit tested
 * and reused by the match-result flow, seeding, and admin recalculation tools.
 */

export const DEFAULT_ELO = 1000;
export const DEFAULT_MMR = 1000;
export const MIN_RATING = 100;

/** Expected score for player A against player B (0..1). */
export function expectedScore(ratingA: number, ratingB: number): number {
  return 1 / (1 + 10 ** ((ratingB - ratingA) / 400));
}

/**
 * K-factor for ELO. New/low-confidence players move faster; established players are stable.
 * `gamesPlayed` is the total decided games the player has (wins + losses) BEFORE this match.
 */
export function eloKFactor(rating: number, gamesPlayed: number): number {
  if (gamesPlayed < 15) {
    return 40;
  }
  if (rating >= 2100) {
    return 16;
  }
  return 24;
}

export interface RatingChange {
  winner: number;
  loser: number;
  winnerDelta: number;
  loserDelta: number;
}

function applyElo(winnerRating: number, loserRating: number, k: number): RatingChange {
  const expectedWinner = expectedScore(winnerRating, loserRating);
  const winnerDelta = Math.round(k * (1 - expectedWinner));
  const loserDelta = Math.round(k * (0 - (1 - expectedWinner)));
  const winner = Math.max(MIN_RATING, winnerRating + winnerDelta);
  const loser = Math.max(MIN_RATING, loserRating + loserDelta);
  return { winner, loser, winnerDelta: winner - winnerRating, loserDelta: loser - loserRating };
}

/** Compute new ELO for both players after a decided match. */
export function computeElo(
  winnerRating: number,
  loserRating: number,
  winnerGamesPlayed: number
): RatingChange {
  return applyElo(winnerRating, loserRating, eloKFactor(winnerRating, winnerGamesPlayed));
}

/** Compute new MMR for both players. MMR uses a flat, slightly higher K for responsiveness. */
export function computeMmr(winnerRating: number, loserRating: number): RatingChange {
  return applyElo(winnerRating, loserRating, 32);
}

export interface StreakState {
  current: number;
  best: number;
}

export function bumpWinStreak(streak: StreakState): StreakState {
  const current = streak.current + 1;
  return { current, best: Math.max(streak.best, current) };
}

export function resetWinStreak(streak: StreakState): StreakState {
  return { current: 0, best: streak.best };
}

/** Average rating of a team roster, rounded. Falls back to the default rating for an empty roster. */
export function teamAverage(ratings: number[], fallback = DEFAULT_ELO): number {
  if (ratings.length === 0) {
    return fallback;
  }
  return Math.round(ratings.reduce((sum, value) => sum + value, 0) / ratings.length);
}

/** Win percentage (0..100), rounded to one decimal. 0 when no games played. */
export function winPercentage(wins: number, losses: number): number {
  const total = wins + losses;
  if (total === 0) {
    return 0;
  }
  return Number(((wins / total) * 100).toFixed(1));
}
