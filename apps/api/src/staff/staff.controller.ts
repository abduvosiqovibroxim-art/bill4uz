import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import { StaffService } from './staff.service';
import { CreateStaffDto, UpdateStaffDto, StaffIdParamDto, ClubIdParamDto } from './dto';
import { JwtAccessGuard } from '../auth/jwt-access.guard';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Staff')
@ApiBearerAuth()
@Controller('clubs/:clubId/staff')
@UseGuards(JwtAccessGuard)
export class StaffController {
  constructor(private readonly staffService: StaffService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new staff member' })
  create(@Param() params: ClubIdParamDto, @Body() createStaffDto: CreateStaffDto) {
    return this.staffService.create(params.clubId, createStaffDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all staff members for a club' })
  findAll(
    @Param() params: ClubIdParamDto,
    @Query('includeInactive') includeInactive?: string,
  ) {
    return this.staffService.findAll(
      params.clubId,
      includeInactive === 'true',
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get staff member details' })
  findOne(@Param() clubParam: ClubIdParamDto, @Param() staffParam: StaffIdParamDto) {
    return this.staffService.findOne(clubParam.clubId, staffParam.id);
  }

  @Get(':id/shifts')
  @ApiOperation({ summary: 'Get staff member shift history' })
  getShiftHistory(@Param() clubParam: ClubIdParamDto, @Param() staffParam: StaffIdParamDto) {
    return this.staffService.getShiftHistory(clubParam.clubId, staffParam.id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update staff member' })
  update(
    @Param() clubParam: ClubIdParamDto,
    @Param() staffParam: StaffIdParamDto,
    @Body() updateStaffDto: UpdateStaffDto,
  ) {
    return this.staffService.update(clubParam.clubId, staffParam.id, updateStaffDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Deactivate staff member (soft delete)' })
  remove(@Param() clubParam: ClubIdParamDto, @Param() staffParam: StaffIdParamDto) {
    return this.staffService.remove(clubParam.clubId, staffParam.id);
  }
}
