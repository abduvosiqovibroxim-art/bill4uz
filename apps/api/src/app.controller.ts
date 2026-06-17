import { Controller, Get } from "@nestjs/common";

@Controller()
export class AppController {
  @Get("health")
  health() {
    return {
      status: "ok",
      service: "billard-uz-api",
      timestamp: new Date().toISOString()
    };
  }
}
