import { Controller, Get, NotFoundException, Param, Query } from "@nestjs/common";
import { CoachesService } from "./coaches.service";
import { CoachIdParamDto, CoachListQueryDto } from "./dto";

@Controller("coaches")
export class CoachesController {
  constructor(private readonly coachesService: CoachesService) {}

  @Get()
  findAll(@Query() query: CoachListQueryDto) {
    return this.coachesService.findAll(query);
  }

  @Get(":id")
  async findOne(@Param() params: CoachIdParamDto) {
    const coach = await this.coachesService.findOne(params.id);
    if (!coach) {
      throw new NotFoundException("Coach not found");
    }
    return coach;
  }
}
