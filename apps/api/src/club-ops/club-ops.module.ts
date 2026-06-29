import { Module } from "@nestjs/common";
import { PrismaModule } from "../common/prisma.module";
import { MenuController } from "./menu.controller";
import { MenuService } from "./menu.service";
import { SessionsController } from "./sessions.controller";
import { SessionsService } from "./sessions.service";

@Module({
  imports: [PrismaModule],
  controllers: [MenuController, SessionsController],
  providers: [MenuService, SessionsService]
})
export class ClubOpsModule {}
