import { ForbiddenException, NotFoundException } from "@nestjs/common";
import { Role } from "@prisma/client";
import { PrismaService } from "../common/prisma.service";
import { RequestUser } from "../auth/dto";

/**
 * Ensures the actor may operate the given club's control panel.
 * ADMIN can manage any club; a CLUB user only their own club.
 */
export async function assertClubAccess(prisma: PrismaService, clubId: string, actor: RequestUser) {
  const club = await prisma.club.findFirst({
    where: { id: clubId, deletedAt: null },
    select: { id: true, userId: true }
  });

  if (!club) {
    throw new NotFoundException("Club not found");
  }

  if (actor.role === Role.ADMIN) {
    return club;
  }

  if (actor.role === Role.CLUB && Boolean(club.userId) && club.userId === actor.sub) {
    return club;
  }

  throw new ForbiddenException("Forbidden");
}
