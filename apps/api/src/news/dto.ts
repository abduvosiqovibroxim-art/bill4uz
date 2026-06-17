import { IsDateString, IsOptional, IsString, MinLength } from "class-validator";
import type { LocalizedTextDto } from "../tournaments/dto";

export class CreateNewsDto {
  @IsString()
  @MinLength(1)
  title!: string;

  @IsString()
  @MinLength(1)
  slug!: string;

  @IsString()
  @MinLength(1)
  category!: string;

  @IsString()
  @MinLength(1)
  content!: string;

  @IsDateString()
  publishedAt!: string;
}

export class UpdateNewsDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  title?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  slug?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  category?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  content?: string;

  @IsOptional()
  @IsDateString()
  publishedAt?: string;
}

export interface NewsComputedFields {
  excerpt: string | LocalizedTextDto;
  categoryKey: string;
}
