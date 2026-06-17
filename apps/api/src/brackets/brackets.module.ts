import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { NotificationsModule } from "../notifications/notifications.module";
import { BracketGenerationService } from "./bracket-generation.service";
import { BracketMatchesController } from "./bracket-matches.controller";
import { BracketMatchesService } from "./bracket-matches.service";
import { BracketMatchProgressionService } from "./match-progression.service";
import { BracketTournamentsController } from "./bracket-tournaments.controller";
import { BracketTournamentsService } from "./bracket-tournaments.service";

@Module({
  imports: [AuthModule, NotificationsModule],
  controllers: [BracketTournamentsController, BracketMatchesController],
  providers: [
    BracketMatchProgressionService,
    BracketGenerationService,
    BracketTournamentsService,
    BracketMatchesService
  ],
  exports: [BracketTournamentsService, BracketMatchesService]
})
export class BracketsModule {}
