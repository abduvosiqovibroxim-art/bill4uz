import { Type } from "class-transformer";
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateNested
} from "class-validator";
import { BracketMatchStatuses } from "./bracket.types";

export class BracketTournamentIdParamDto {
  @IsString()
  id!: string;
}

export class BracketTournamentParticipantParamDto {
  @IsString()
  id!: string;

  @IsString()
  participantId!: string;
}

export class BracketMatchIdParamDto {
  @IsString()
  id!: string;
}

export class BracketParticipantDto {
  @IsString()
  @MaxLength(120)
  playerId!: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  seed?: number;
}

export class AddBracketParticipantsDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(64)
  @ValidateNested({ each: true })
  @Type(() => BracketParticipantDto)
  participants!: BracketParticipantDto[];
}

export class AddTeamParticipantsDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(128)
  @IsString({ each: true })
  teamIds!: string[];
}

export class ManualDrawDto {
  @IsArray()
  @ArrayMinSize(2)
  @ArrayMaxSize(64)
  @IsString({ each: true })
  @MaxLength(120, { each: true })
  names!: string[];
}

export class UpdateBracketResultDto {
  @IsString()
  winnerId!: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  player1Score?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  player2Score?: number;
}

export class UpdateBracketStatusDto {
  @IsEnum(BracketMatchStatuses)
  status!: (typeof BracketMatchStatuses)[keyof typeof BracketMatchStatuses];
}
