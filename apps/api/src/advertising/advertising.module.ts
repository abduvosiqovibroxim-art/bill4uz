import { Module } from "@nestjs/common";
import { EmailModule } from "../email/email.module";
import { NotificationsModule } from "../notifications/notifications.module";
import { AdvertisingController } from "./advertising.controller";
import { AdvertisingService } from "./advertising.service";

@Module({
  imports: [EmailModule, NotificationsModule],
  controllers: [AdvertisingController],
  providers: [AdvertisingService],
  exports: [AdvertisingService]
})
export class AdvertisingModule {}
