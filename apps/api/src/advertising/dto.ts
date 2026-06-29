import { IsOptional, IsString, MaxLength, MinLength } from "class-validator";

export class CreateAdvertisingRequestDto {
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name!: string;

  @IsString()
  @MinLength(3)
  @MaxLength(160)
  contact!: string;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  company?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  budget?: string;

  @IsString()
  @MinLength(5)
  @MaxLength(2000)
  message!: string;
}
