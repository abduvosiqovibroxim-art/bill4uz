export const BracketFormats = {
  SINGLE_ELIMINATION: "SINGLE_ELIMINATION",
  DOUBLE_ELIMINATION: "DOUBLE_ELIMINATION"
} as const;

export const BracketMatchStatuses = {
  PENDING: "PENDING",
  READY: "READY",
  LIVE: "LIVE",
  FINISHED: "FINISHED"
} as const;

export const BracketMatchPhases = {
  UPPER: "UPPER",
  LOWER: "LOWER",
  FINAL: "FINAL"
} as const;

export const BracketNextSlots = {
  PLAYER1: "PLAYER1",
  PLAYER2: "PLAYER2"
} as const;

export type BracketFormatValue = (typeof BracketFormats)[keyof typeof BracketFormats];
export type BracketMatchStatusValue = (typeof BracketMatchStatuses)[keyof typeof BracketMatchStatuses];
export type BracketMatchPhaseValue = (typeof BracketMatchPhases)[keyof typeof BracketMatchPhases];
export type BracketNextSlotValue = (typeof BracketNextSlots)[keyof typeof BracketNextSlots];

export interface BracketParticipantInput {
  playerId: string;
  seed?: number;
}

export interface BracketMatchBlueprint {
  id: string;
  tournamentId: string;
  round: number;
  matchNumber: number;
  phase: BracketMatchPhaseValue;
  player1Id: string | null;
  player2Id: string | null;
  winnerId: string | null;
  loserId: string | null;
  status: BracketMatchStatusValue;
  scheduledAt: Date | null;
  tableNumber: number | null;
  bestOf: number;
  isBye: boolean;
  isThirdPlace: boolean;
  groupIndex: number | null;
  nextMatchId: string | null;
  nextSlot: BracketNextSlotValue | null;
  loserNextMatchId: string | null;
  loserNextSlot: BracketNextSlotValue | null;
  player1Score: number | null;
  player2Score: number | null;
}

export interface UpdateBracketResultInput {
  winnerId: string;
  player1Score?: number;
  player2Score?: number;
}

export interface UpdateBracketStatusInput {
  status: BracketMatchStatusValue;
}
