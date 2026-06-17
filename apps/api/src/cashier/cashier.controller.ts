import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CashierService } from './cashier.service';
import {
  OpenShiftDto,
  CloseShiftDto,
  CreateTransactionDto,
  ShiftIdParamDto,
  ClubIdParamDto,
} from './dto';
import { JwtAccessGuard } from '../auth/jwt-access.guard';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Cashier')
@ApiBearerAuth()
@Controller('clubs/:clubId/cashier')
@UseGuards(JwtAccessGuard)
export class CashierController {
  constructor(private readonly cashierService: CashierService) {}

  // === SHIFT ENDPOINTS ===

  @Post('shifts/open')
  @ApiOperation({ summary: 'Open a new shift for a staff member' })
  openShift(@Param() params: ClubIdParamDto, @Body() dto: OpenShiftDto) {
    return this.cashierService.openShift(params.clubId, dto);
  }

  @Post('shifts/:id/close')
  @ApiOperation({ summary: 'Close an open shift' })
  closeShift(
    @Param() clubParam: ClubIdParamDto,
    @Param() shiftParam: ShiftIdParamDto,
    @Body() dto: CloseShiftDto,
  ) {
    return this.cashierService.closeShift(clubParam.clubId, shiftParam.id, dto);
  }

  @Get('shifts/current')
  @ApiOperation({ summary: 'Get current open shift for a staff member' })
  getCurrentShift(
    @Param() params: ClubIdParamDto,
    @Query('staffId') staffId: string,
  ) {
    return this.cashierService.getCurrentShift(params.clubId, staffId);
  }

  @Get('shifts')
  @ApiOperation({ summary: 'Get shift history' })
  getShiftHistory(
    @Param() params: ClubIdParamDto,
    @Query('limit') limit?: string,
  ) {
    return this.cashierService.getShiftHistory(
      params.clubId,
      limit ? parseInt(limit, 10) : 50,
    );
  }

  // === TRANSACTION ENDPOINTS ===

  @Post('shifts/:id/transactions')
  @ApiOperation({ summary: 'Create a transaction in a shift' })
  createTransaction(
    @Param() clubParam: ClubIdParamDto,
    @Param() shiftParam: ShiftIdParamDto,
    @Body() dto: CreateTransactionDto,
  ) {
    return this.cashierService.createTransaction(
      clubParam.clubId,
      shiftParam.id,
      dto,
    );
  }

  @Get('shifts/:id/transactions')
  @ApiOperation({ summary: 'Get all transactions for a shift' })
  getTransactions(
    @Param() clubParam: ClubIdParamDto,
    @Param() shiftParam: ShiftIdParamDto,
  ) {
    return this.cashierService.getTransactions(clubParam.clubId, shiftParam.id);
  }

  // === REPORTS ===

  @Get('reports/daily')
  @ApiOperation({ summary: 'Get daily sales report' })
  getDailyReport(
    @Param() params: ClubIdParamDto,
    @Query('date') dateStr?: string,
  ) {
    const date = dateStr ? new Date(dateStr) : new Date();
    return this.cashierService.getDailyReport(params.clubId, date);
  }
}
