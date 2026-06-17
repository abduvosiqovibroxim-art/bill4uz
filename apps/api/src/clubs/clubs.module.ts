import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { AdminClubsController, ClubsController } from "./clubs.controller";
import { ClubImportService } from "./club-import.service";
import { ClubsService } from "./clubs.service";

@Module({
  imports: [AuthModule],
  controllers: [ClubsController, AdminClubsController],
  providers: [ClubsService, ClubImportService],
  exports: [ClubsService]
})
export class ClubsModule {}
