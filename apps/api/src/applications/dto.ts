import { ApplicationStatus } from "@prisma/client";
import { IsEnum, IsString } from "class-validator";

export class CreateApplicationDto {
  @IsString()
  tournamentId!: string;
}

export class ModerateApplicationDto {
  @IsEnum(ApplicationStatus)
  status!: ApplicationStatus;
}
