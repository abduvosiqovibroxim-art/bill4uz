import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { ApplicationsModule } from "../applications/applications.module";
import { NotificationsModule } from "../notifications/notifications.module";
import { BracketsModule } from "../brackets/brackets.module";
import { BotController } from "./bot.controller";
import { BotService } from "./bot.service";
import { BotInternalGuard } from "./bot.guard";

@Module({
  imports: [AuthModule, ApplicationsModule, NotificationsModule, BracketsModule],
  controllers: [BotController],
  providers: [BotService, BotInternalGuard],
  exports: [BotService]
})
export class BotModule {}
