import { Type } from "class-transformer";
import {
  BilliardKind,
  PlayerLevel,
  ParticipantSelectionMode,
  TournamentBracketSystem,
  TournamentCategory,
  TournamentFormat,
  TournamentLevel,
  TournamentType,
  TournamentStatus
} from "@prisma/client";
import {
  ArrayMaxSize,
  IsArray,
  IsDateString,
  IsEnum,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Min,
  ValidateNested
} from "class-validator";
import { BracketFormats } from "../brackets/bracket.types";

export class LocalizedTextDto {
  @IsString()
  ru!: string;

  @IsString()
  uz!: string;

  @IsString()
  en!: string;
}

export class TournamentRegulationInputDto {
  @ValidateNested()
  @Type(() => LocalizedTextDto)
  format!: LocalizedTextDto;

  @ValidateNested()
  @Type(() => LocalizedTextDto)
  entryFee!: LocalizedTextDto;

  @IsArray()
  @ArrayMaxSize(12)
  @ValidateNested({ each: true })
  @Type(() => LocalizedTextDto)
  participationTerms!: LocalizedTextDto[];

  @IsArray()
  @ArrayMaxSize(12)
  @ValidateNested({ each: true })
  @Type(() => LocalizedTextDto)
  restrictions!: LocalizedTextDto[];

  @IsArray()
  @ArrayMaxSize(12)
  @ValidateNested({ each: true })
  @Type(() => LocalizedTextDto)
  notes!: LocalizedTextDto[];
}

export class CreateTournamentDto {
  @IsString()
  title!: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => LocalizedTextDto)
  description?: LocalizedTextDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => LocalizedTextDto)
  registrationLabel?: LocalizedTextDto;

  @IsString()
  disciplineId!: string;

  @IsString()
  clubId!: string;

  @IsOptional()
  @IsEnum(BilliardKind)
  billiardKind?: BilliardKind;

  @IsOptional()
  @IsEnum(TournamentCategory)
  category?: TournamentCategory;

  @IsOptional()
  @IsEnum(TournamentLevel)
  tournamentLevel?: TournamentLevel;

  @IsOptional()
  @IsEnum(TournamentFormat)
  eventFormat?: TournamentFormat;

  @IsOptional()
  @IsEnum(TournamentBracketSystem)
  bracketSystem?: TournamentBracketSystem;

  @IsOptional()
  @IsEnum(ParticipantSelectionMode)
  participantSelectionMode?: ParticipantSelectionMode;

  @IsOptional()
  @IsEnum(TournamentType)
  tournamentType?: TournamentType;

  @IsOptional()
  @IsEnum(PlayerLevel)
  minPlayerLevel?: PlayerLevel;

  @IsOptional()
  @IsEnum(PlayerLevel)
  maxPlayerLevel?: PlayerLevel;

  @IsDateString()
  startsAt!: string;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  prizePool!: number;

  @IsOptional()
  @IsEnum(TournamentStatus)
  status?: TournamentStatus;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsIn([8, 16, 32, 64])
  bracketSize?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsIn([2, 3, 7])
  repeatEveryDays?: number | null;

  @IsOptional()
  @ValidateNested()
  @Type(() => TournamentRegulationInputDto)
  regulation?: TournamentRegulationInputDto;

  @IsOptional()
  @IsEnum(BracketFormats)
  bracketFormat?: keyof typeof BracketFormats;
}

export class UpdateTournamentDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => LocalizedTextDto)
  description?: LocalizedTextDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => LocalizedTextDto)
  registrationLabel?: LocalizedTextDto;

  @IsOptional()
  @IsString()
  disciplineId?: string;

  @IsOptional()
  @IsString()
  clubId?: string;

  @IsOptional()
  @IsEnum(BilliardKind)
  billiardKind?: BilliardKind;

  @IsOptional()
  @IsEnum(TournamentCategory)
  category?: TournamentCategory;

  @IsOptional()
  @IsEnum(TournamentLevel)
  tournamentLevel?: TournamentLevel;

  @IsOptional()
  @IsEnum(TournamentFormat)
  eventFormat?: TournamentFormat;

  @IsOptional()
  @IsEnum(TournamentBracketSystem)
  bracketSystem?: TournamentBracketSystem;

  @IsOptional()
  @IsEnum(ParticipantSelectionMode)
  participantSelectionMode?: ParticipantSelectionMode;

  @IsOptional()
  @IsEnum(TournamentType)
  tournamentType?: TournamentType;

  @IsOptional()
  @IsEnum(PlayerLevel)
  minPlayerLevel?: PlayerLevel;

  @IsOptional()
  @IsEnum(PlayerLevel)
  maxPlayerLevel?: PlayerLevel;

  @IsOptional()
  @IsDateString()
  startsAt?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  prizePool?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  participants?: number;

  @IsOptional()
  @IsEnum(TournamentStatus)
  status?: TournamentStatus;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsIn([8, 16, 32, 64])
  bracketSize?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsIn([2, 3, 7])
  repeatEveryDays?: number | null;

  @IsOptional()
  @ValidateNested()
  @Type(() => TournamentRegulationInputDto)
  regulation?: TournamentRegulationInputDto;

  @IsOptional()
  @IsEnum(BracketFormats)
  bracketFormat?: keyof typeof BracketFormats;
}

export type TournamentBracketType =
  | "singleElimination"
  | "doubleElimination"
  | "roundRobin"
  | "swiss"
  | "groupPlayoff";
export type TournamentMatchPhase = "upper" | "lower" | "final";
export type TournamentMatchStatus = "pending" | "ready" | "live" | "finished";
export type TournamentParticipantStatus = "active" | "eliminated" | "winner" | "finalist" | "semifinalist";

export interface TournamentClubPreviewDto {
  id: string;
  name: string;
  address: string;
  cityKey: string;
  countryKey: string;
}

export interface TournamentMatchPlayerDto {
  id: string;
  fullName: string;
  clubId: string | null;
  clubName: string | null;
  cityKey: string;
  countryKey: string;
  seed: number | null;
}

export interface TournamentParticipantDto extends TournamentMatchPlayerDto {
  seed: number;
  rating: number;
  wins: number;
  losses: number;
  status: TournamentParticipantStatus;
  placement: number | null;
}

export interface TournamentMatchScoreDto {
  a: number | null;
  b: number | null;
}

export interface TournamentBracketMatchDto {
  id: string;
  matchNumber: number;
  roundNumber: number;
  roundKey: string;
  phase: TournamentMatchPhase;
  tableNumber: number | null;
  scheduledAt: string;
  bestOf: number;
  status: TournamentMatchStatus;
  isBye: boolean;
  playerA: TournamentMatchPlayerDto | null;
  playerB: TournamentMatchPlayerDto | null;
  score: TournamentMatchScoreDto;
  winnerId: string | null;
  winnerTo: string | null;
  loserTo: string | null;
  isThirdPlace: boolean;
  isFinalReset: boolean;
  groupIndex: number | null;
}

export interface TournamentBracketRoundDto {
  id: string;
  label: string;
  phase: TournamentMatchPhase;
  roundNumber: number;
  placeRange: string | null;
  matches: TournamentBracketMatchDto[];
}

export interface TournamentResultDto {
  placement: number;
  placeLabel: string;
  label: string;
  player: TournamentMatchPlayerDto;
  rating: number;
}

export interface TournamentRegulationDto {
  format: LocalizedTextDto;
  entryFee: LocalizedTextDto;
  participationTerms: LocalizedTextDto[];
  restrictions: LocalizedTextDto[];
  notes: LocalizedTextDto[];
  discipline: LocalizedTextDto;
}

export interface TournamentComputedFields {
  cityKey: string;
  disciplineKey: string;
  disciplineName: string;
  billiardKind: BilliardKind;
  category: TournamentCategory;
  tournamentLevel: TournamentLevel;
  eventFormat: TournamentFormat;
  bracketSystem: TournamentBracketSystem;
  participantSelectionMode: ParticipantSelectionMode;
  tournamentType: TournamentType;
  minPlayerLevel: PlayerLevel;
  maxPlayerLevel: PlayerLevel;
  repeatEveryDays: number | null;
  billiardKindLabel: LocalizedTextDto;
  categoryLabel: LocalizedTextDto;
  tournamentLevelLabel: LocalizedTextDto;
  eventFormatLabel: LocalizedTextDto;
  bracketSystemLabel: LocalizedTextDto;
  participantSelectionModeLabel: LocalizedTextDto;
  tournamentTypeLabel: LocalizedTextDto;
  minPlayerLevelLabel: LocalizedTextDto;
  maxPlayerLevelLabel: LocalizedTextDto;
  subtitle: string | LocalizedTextDto | null;
  organizer: string | null;
  registrationLabel: string | LocalizedTextDto | null;
  format: string | LocalizedTextDto | null;
  schedule: Array<string | LocalizedTextDto> | null;
  participantsCount: number;
  clubPreview: TournamentClubPreviewDto | null;
}

export interface TournamentDetailComputedFields extends TournamentComputedFields {
  description: string | LocalizedTextDto | null;
  bracketType: TournamentBracketType;
  rounds: TournamentBracketRoundDto[];
  matches: TournamentBracketMatchDto[];
  participantsList: TournamentParticipantDto[];
  results: TournamentResultDto[];
  regulation: TournamentRegulationDto;
}
