import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  if (process.env.NODE_ENV === "production" && process.env.ALLOW_PRODUCTION_DEMO_CLEANUP !== "true") {
    console.warn("Demo cleanup is disabled in production. Set ALLOW_PRODUCTION_DEMO_CLEANUP=true to run it.");
    return;
  }

  const demoClubName = ["Black", "Pool"].join(" ");
  const demoClubWhere = {
    OR: [
      { name: { startsWith: "QA ", mode: "insensitive" as const } },
      { name: { contains: "Demo", mode: "insensitive" as const } },
      { name: { equals: demoClubName, mode: "insensitive" as const } },
      { id: { contains: "qa-", mode: "insensitive" as const } },
      { source: { equals: "DEMO", mode: "insensitive" as const } }
    ]
  };
  const demoTournamentWhere = {
    OR: [
      { id: { contains: "qa-", mode: "insensitive" as const } },
      { title: { startsWith: "QA ", mode: "insensitive" as const } },
      { title: { contains: "Demo", mode: "insensitive" as const } }
    ]
  };
  const demoPlayerWhere = {
    OR: [
      { fullName: { startsWith: "QA ", mode: "insensitive" as const } },
      { fullName: { contains: "Demo", mode: "insensitive" as const } },
      { user: { email: { contains: "@billuz.local", mode: "insensitive" as const } } },
      { user: { email: { startsWith: "qa.", mode: "insensitive" as const } } }
    ]
  };
  const demoUserWhere = {
    OR: [
      { email: { contains: "@billuz.local", mode: "insensitive" as const } },
      { email: { startsWith: "qa.", mode: "insensitive" as const } },
      { phone: { in: ["+998900000000", "+998900009999"] } }
    ]
  };

  const clubs = await prisma.club.findMany({ where: demoClubWhere, select: { id: true, userId: true } });
  const players = await prisma.player.findMany({ where: demoPlayerWhere, select: { id: true, userId: true } });
  const users = await prisma.user.findMany({ where: demoUserWhere, select: { id: true } });

  const clubIds = clubs.map((item) => item.id);
  const playerIds = players.map((item) => item.id);
  const preliminaryUserIds = unique([
    ...users.map((item) => item.id),
    ...clubs.map((item) => item.userId).filter((value): value is string => Boolean(value)),
    ...players.map((item) => item.userId)
  ]);
  const tournaments = await prisma.tournament.findMany({
    where: {
      OR: [
        demoTournamentWhere,
        { clubId: { in: clubIds } },
        { organizerId: { in: preliminaryUserIds } }
      ]
    },
    select: { id: true, organizerId: true }
  });

  const tournamentIds = tournaments.map((item) => item.id);
  const userIds = unique([
    ...preliminaryUserIds,
    ...tournaments.map((item) => item.organizerId)
  ]);

  const result = await prisma.$transaction(async (tx) => {
    const deleted = {
      auditLogs: await tx.auditLog.deleteMany({
        where: {
          OR: [
            { actorUserId: { in: userIds } },
            { entityId: { in: [...clubIds, ...tournamentIds, ...playerIds, ...userIds] } }
          ]
        }
      }),
      notifications: await tx.notification.deleteMany({ where: { userId: { in: userIds } } }),
      authTokens: await tx.authToken.deleteMany({ where: { userId: { in: userIds } } }),
      refreshTokens: await tx.refreshToken.deleteMany({ where: { userId: { in: userIds } } }),
      telegramLinkTokens: await tx.telegramLinkToken.deleteMany({ where: { userId: { in: userIds } } }),
      reels: await tx.reel.deleteMany({
        where: {
          OR: [
            { tournamentId: { in: tournamentIds } },
            { clubId: { in: clubIds } },
            { playerId: { in: playerIds } },
            { authorId: { in: userIds } }
          ]
        }
      }),
      bookings: await tx.booking.deleteMany({
        where: {
          OR: [
            { clubId: { in: clubIds } },
            { playerId: { in: playerIds } },
            { userId: { in: userIds } }
          ]
        }
      }),
      matches: await tx.match.deleteMany({
        where: {
          OR: [
            { tournamentId: { in: tournamentIds } },
            { playerAId: { in: playerIds } },
            { playerBId: { in: playerIds } }
          ]
        }
      }),
      bracketMatches: await tx.bracketMatch.deleteMany({ where: { tournamentId: { in: tournamentIds } } }),
      bracketParticipants: await tx.bracketParticipant.deleteMany({
        where: {
          OR: [
            { tournamentId: { in: tournamentIds } },
            { playerId: { in: playerIds } },
            { name: { startsWith: "QA ", mode: "insensitive" } },
            { name: { contains: "Demo", mode: "insensitive" } }
          ]
        }
      }),
      applications: await tx.application.deleteMany({
        where: {
          OR: [
            { tournamentId: { in: tournamentIds } },
            { playerId: { in: playerIds } }
          ]
        }
      }),
      rankings: await tx.ranking.deleteMany({ where: { playerId: { in: playerIds } } }),
      tournaments: await tx.tournament.deleteMany({ where: { id: { in: tournamentIds } } }),
      clubTables: await tx.clubTable.deleteMany({ where: { clubId: { in: clubIds } } }),
      players: await tx.player.deleteMany({ where: { id: { in: playerIds } } }),
      clubs: await tx.club.deleteMany({ where: { id: { in: clubIds } } }),
      users: await tx.user.deleteMany({ where: { id: { in: userIds } } })
    };

    return Object.fromEntries(Object.entries(deleted).map(([key, value]) => [key, value.count]));
  });

  console.log(
    JSON.stringify(
      {
        status: "ok",
        deleted: result
      },
      null,
      2
    )
  );
}

function unique(values: string[]) {
  return Array.from(new Set(values));
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
