import { Type } from "class-transformer";
import { BookingStatus, ClubTableStatus } from "@prisma/client";
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsIn,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Min
} from "class-validator";

export class CreateClubTableDto {
  @IsString()
  @MaxLength(80)
  name!: string;

  @IsString()
  @IsIn(["REGULAR", "VIP"])
  @MaxLength(64)
  kind!: string;

  @IsOptional()
  @IsEnum(ClubTableStatus)
  status?: ClubTableStatus;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  sortOrder?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(30)
  minBookingMinutes?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(30)
  maxBookingMinutes?: number;
}

export class UpdateClubTableDto {
  @IsOptional()
  @IsString()
  @MaxLength(80)
  name?: string;

  @IsOptional()
  @IsString()
  @IsIn(["REGULAR", "VIP"])
  @MaxLength(64)
  kind?: string;

  @IsOptional()
  @IsEnum(ClubTableStatus)
  status?: ClubTableStatus;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  sortOrder?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(30)
  minBookingMinutes?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(30)
  maxBookingMinutes?: number;
}

export class CreateBookingDto {
  @IsString()
  clubId!: string;

  @IsOptional()
  @IsString()
  tableId?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  tableNumber?: number;

  @IsOptional()
  @IsDateString()
  startAt?: string;

  @IsOptional()
  @IsDateString()
  startTime?: string;

  @IsOptional()
  @IsDateString()
  endTime?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(60)
  durationMinutes?: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  clientRequestId?: string;
}

export class UpdateBookingStatusDto {
  @IsEnum(BookingStatus)
  @IsIn([BookingStatus.CONFIRMED, BookingStatus.CANCELLED, BookingStatus.FINISHED])
  status!: BookingStatus;
}

export class BookingSlotsQueryDto {
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  date!: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(60)
  durationMinutes?: number;
}
