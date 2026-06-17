import { PlayerLevel } from "@prisma/client";

export const PLAYER_LEVEL_ORDER: PlayerLevel[] = [
  PlayerLevel.NOVICE,
  PlayerLevel.AMATEUR,
  PlayerLevel.STRONG_AMATEUR,
  PlayerLevel.SEMI_PRO,
  PlayerLevel.PRO
];

export const PLAYER_LEVEL_MIN_POINTS: Record<PlayerLevel, number> = {
  [PlayerLevel.NOVICE]: 0,
  [PlayerLevel.AMATEUR]: 20,
  [PlayerLevel.STRONG_AMATEUR]: 50,
  [PlayerLevel.SEMI_PRO]: 90,
  [PlayerLevel.PRO]: 140
};

export function normalizeLevelPoints(value: number) {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.max(0, Math.trunc(value));
}

export function playerLevelFromPoints(pointsInput: number): PlayerLevel {
  const points = normalizeLevelPoints(pointsInput);

  for (let index = PLAYER_LEVEL_ORDER.length - 1; index >= 0; index -= 1) {
    const level = PLAYER_LEVEL_ORDER[index];
    if (points >= PLAYER_LEVEL_MIN_POINTS[level]) {
      return level;
    }
  }

  return PlayerLevel.NOVICE;
}

export function nextPlayerLevel(level: PlayerLevel): PlayerLevel | null {
  const index = PLAYER_LEVEL_ORDER.indexOf(level);
  if (index === -1 || index >= PLAYER_LEVEL_ORDER.length - 1) {
    return null;
  }

  return PLAYER_LEVEL_ORDER[index + 1];
}

export function pointsToNextLevel(pointsInput: number): number {
  const points = normalizeLevelPoints(pointsInput);
  const level = playerLevelFromPoints(points);
  const next = nextPlayerLevel(level);

  if (!next) {
    return 0;
  }

  return Math.max(0, PLAYER_LEVEL_MIN_POINTS[next] - points);
}

export function isPlayerLevelInRange(level: PlayerLevel, minLevel: PlayerLevel, maxLevel: PlayerLevel): boolean {
  const levelWeight = PLAYER_LEVEL_ORDER.indexOf(level);
  const minWeight = PLAYER_LEVEL_ORDER.indexOf(minLevel);
  const maxWeight = PLAYER_LEVEL_ORDER.indexOf(maxLevel);

  if (levelWeight === -1 || minWeight === -1 || maxWeight === -1) {
    return false;
  }

  return levelWeight >= minWeight && levelWeight <= maxWeight;
}
