import { Type } from 'class-transformer';
import {
  IsString,
  IsEnum,
  IsOptional,
  IsInt,
  Min,
  IsDateString,
} from 'class-validator';
import { PaymentMethod, TransactionType } from '@prisma/client';

// === SHIFT DTOs ===

export class OpenShiftDto {
  @IsString()
  staffId!: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  openingCashMinor?: number;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class CloseShiftDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  closingCashMinor?: number;

  @IsOptional()
  @IsString()
  notes?: string;
}

// === TRANSACTION DTOs ===

export class CreateTransactionDto {
  @IsEnum(TransactionType)
  type!: TransactionType;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  amountMinor!: number;

  @IsEnum(PaymentMethod)
  paymentMethod!: PaymentMethod;

  @IsOptional()
  @IsString()
  bookingId?: string;

  @IsOptional()
  @IsString()
  tableSessionId?: string;

  @IsOptional()
  @IsString()
  menuOrderId?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  metadata?: Record<string, any>;
}

// === PARAM DTOs ===

export class ShiftIdParamDto {
  @IsString()
  id!: string;
}

export class ClubIdParamDto {
  @IsString()
  clubId!: string;
}
