import { IsOptional, IsString } from "class-validator";

export class CoachListQueryDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  cityId?: string;

  @IsOptional()
  @IsString()
  region?: string;

  @IsOptional()
  @IsString()
  discipline?: string;

  @IsOptional()
  @IsString()
  qualification?: string;
}

export class CoachIdParamDto {
  @IsString()
  id!: string;
}
