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
    @Param('clubId') clubId: string,
    @Param('id') shiftId: string,
    @Body() dto: CloseShiftDto,
  ) {
    return this.cashierService.closeShift(clubId, shiftId, dto);
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
    @Param('clubId') clubId: string,
    @Param('id') shiftId: string,
    @Body() dto: CreateTransactionDto,
  ) {
    return this.cashierService.createTransaction(clubId, shiftId, dto);
  }

  @Get('shifts/:id/transactions')
  @ApiOperation({ summary: 'Get all transactions for a shift' })
  getTransactions(
    @Param('clubId') clubId: string,
    @Param('id') shiftId: string,
  ) {
    return this.cashierService.getTransactions(clubId, shiftId);
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
