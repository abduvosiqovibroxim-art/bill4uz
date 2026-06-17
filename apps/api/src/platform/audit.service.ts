import { Injectable } from "@nestjs/common";
import { RequestUser } from "../auth/dto";
import { PrismaService } from "../common/prisma.service";

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async log(input: {
    actor?: RequestUser | null;
    actorUserId?: string | null;
    action: string;
    entityType: string;
    entityId: string;
    metadata?: unknown;
  }) {
    return this.prisma.auditLog.create({
      data: {
        actorUserId: input.actor?.sub ?? input.actorUserId ?? null,
        action: input.action,
        entityType: input.entityType,
        entityId: input.entityId,
        metadata: input.metadata as object | undefined
      }
    });
  }
}
