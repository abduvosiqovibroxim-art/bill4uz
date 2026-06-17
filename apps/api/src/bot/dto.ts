import { Type } from "class-transformer";
import { IsBoolean, IsIn, IsInt, IsOptional, IsString, MaxLength, Min } from "class-validator";

export class ConsumeTelegramLinkDto {
  @IsString()
  @MaxLength(128)
  token!: string;

  @IsString()
  @MaxLength(32)
  telegramId!: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  telegramUsername?: string;
}

export class SetTelegramLanguageDto {
  @IsString()
  @MaxLength(32)
  telegramId!: string;

  @IsIn(["ru", "uz"])
  language!: "ru" | "uz";
}

export class RegisterTelegramPlayerDto extends SetTelegramLanguageDto {
  @IsOptional()
  @IsString()
  @MaxLength(64)
  telegramUsername?: string;

  @IsString()
  @MaxLength(120)
  fullName!: string;

  @IsString()
  @MaxLength(80)
  city!: string;

  @IsString()
  @MaxLength(32)
  phone!: string;
}

export class LinkExistingTelegramPlayerDto {
  @IsString()
  @MaxLength(32)
  telegramId!: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  telegramUsername?: string;

  @IsString()
  @MaxLength(32)
  phone!: string;
}

export class TelegramActorDto {
  @IsString()
  @MaxLength(32)
  telegramId!: string;
}

export class CreateTelegramGroupMatchDto {
  @IsString()
  @MaxLength(64)
  chatId!: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  messageId?: number;

  @IsString()
  @MaxLength(32)
  playerOneTelegramId!: string;

  @IsString()
  @MaxLength(120)
  playerOneName!: string;

  @IsString()
  @MaxLength(32)
  playerTwoTelegramId!: string;

  @IsString()
  @MaxLength(120)
  playerTwoName!: string;

  @IsString()
  @MaxLength(32)
  createdByTelegramId!: string;
}

export class UpdateTelegramGroupMatchMessageDto {
  @IsString()
  @MaxLength(64)
  chatId!: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  messageId!: number;
}

export class TelegramGroupMatchActionDto {
  @IsString()
  @MaxLength(64)
  chatId!: string;

  @IsString()
  @MaxLength(32)
  actorTelegramId!: string;

  @IsBoolean()
  actorIsAdmin!: boolean;
}

export class TelegramGroupMatchPointDto extends TelegramGroupMatchActionDto {
  @Type(() => Number)
  @IsInt()
  @IsIn([1, 2])
  side!: 1 | 2;
}
