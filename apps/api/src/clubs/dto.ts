import { Type } from "class-transformer";
import {
  ArrayMaxSize,
  IsArray,
  IsInt,
  IsLatitude,
  IsLongitude,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Min
} from "class-validator";
import type { LocalizedTextDto } from "../tournaments/dto";

export class CreateClubDto {
  @IsString()
  @MaxLength(160)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @IsString()
  countryId!: string;

  @IsString()
  cityId!: string;

  @IsString()
  @MaxLength(240)
  address!: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  region?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  district?: string;

  @IsString()
  @MaxLength(32)
  phone!: string;

  @IsString()
  @MaxLength(64)
  telegram!: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  workingHours?: string;

  @IsOptional()
  @Matches(/^\d{2}:\d{2}$/)
  openTime?: string;

  @IsOptional()
  @Matches(/^\d{2}:\d{2}$/)
  closeTime?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  tables?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  vipTables?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  regularMorningPriceMinor?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  regularEveningPriceMinor?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  vipMorningPriceMinor?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  vipEveningPriceMinor?: number;

  @IsArray()
  @ArrayMaxSize(16)
  @IsString({ each: true })
  disciplines!: string[];

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(16)
  @IsString({ each: true })
  services?: string[];

  @IsOptional()
  @IsString()
  @MaxLength(500)
  coverUrl?: string;

  @IsOptional()
  @Type(() => Number)
  @IsLatitude()
  latitude?: number;

  @IsOptional()
  @Type(() => Number)
  @IsLongitude()
  longitude?: number;

  @IsOptional()
  @Type(() => Number)
  @IsLatitude()
  lat?: number;

  @IsOptional()
  @Type(() => Number)
  @IsLongitude()
  lng?: number;
}

export class UpdateClubDto {
  @IsOptional()
  @IsString()
  @MaxLength(160)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @IsOptional()
  @IsString()
  countryId?: string;

  @IsOptional()
  @IsString()
  cityId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(240)
  address?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  region?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  district?: string;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  phone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  telegram?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  workingHours?: string;

  @IsOptional()
  @Matches(/^\d{2}:\d{2}$/)
  openTime?: string;

  @IsOptional()
  @Matches(/^\d{2}:\d{2}$/)
  closeTime?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  tables?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  vipTables?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  regularMorningPriceMinor?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  regularEveningPriceMinor?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  vipMorningPriceMinor?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  vipEveningPriceMinor?: number;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(16)
  @IsString({ each: true })
  disciplines?: string[];

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(16)
  @IsString({ each: true })
  services?: string[];

  @IsOptional()
  @IsString()
  @MaxLength(500)
  coverUrl?: string;

  @IsOptional()
  @Type(() => Number)
  @IsLatitude()
  latitude?: number;

  @IsOptional()
  @Type(() => Number)
  @IsLongitude()
  longitude?: number;

  @IsOptional()
  @Type(() => Number)
  @IsLatitude()
  lat?: number;

  @IsOptional()
  @Type(() => Number)
  @IsLongitude()
  lng?: number;
}

export interface ClubComputedFields {
  cityKey: string;
  countryKey: string;
  districtKey: string | null;
  rating: number | null;
  services: string[];
  workHours: string | LocalizedTextDto | null;
  tableCount: number;
  latitude: number | null;
  longitude: number | null;
  isActive: boolean;
  isOnboarded: boolean;
  vipTableCount: number;
  regularMorningPriceMinor: number | null;
  regularEveningPriceMinor: number | null;
  vipMorningPriceMinor: number | null;
  vipEveningPriceMinor: number | null;
}
