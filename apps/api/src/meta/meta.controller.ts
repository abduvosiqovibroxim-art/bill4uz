import { Controller, Get } from "@nestjs/common";
import { MetaService } from "./meta.service";

@Controller("meta")
export class MetaController {
  constructor(private readonly metaService: MetaService) {}

  @Get("countries")
  countries() {
    return this.metaService.countries();
  }

  @Get("cities")
  cities() {
    return this.metaService.cities();
  }

  @Get("disciplines")
  disciplines() {
    return this.metaService.disciplines();
  }
}
