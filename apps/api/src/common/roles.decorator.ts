import { SetMetadata } from "@nestjs/common";
import { AppRole } from "./roles";

export const Roles = (...roles: AppRole[]) => SetMetadata("roles", roles);
