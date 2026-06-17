import { Controller, Get, Param } from "@nestjs/common";
import { NotificationsService } from "./notifications.service";

@Controller("notifications")
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get(":userId")
  byUser(@Param("userId") userId: string) {
    return this.notificationsService.forUser(userId);
  }
}
