import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Reflector } from "@nestjs/core";
import { Role } from "@prisma/client";
import { canAccessRole, type AuthCapability } from "../auth/special-access";
import { AppRole } from "./roles";

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly configService: ConfigService
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const roles = this.reflector.getAllAndOverride<AppRole[]>("roles", [
      context.getHandler(),
      context.getClass()
    ]);
    if (!roles || roles.length === 0) return true;
    const request = context.switchToHttp().getRequest();
    const user = request.user as { role?: AppRole; capabilities?: AuthCapability[] | null } | undefined;
    return roles.some((role) => canAccessRole(this.configService, user as { role?: Role; capabilities?: AuthCapability[] | null }, role as Role));
  }
}
