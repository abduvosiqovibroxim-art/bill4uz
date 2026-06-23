import { PrismaClient, Role, TournamentStatus } from "@prisma/client";
import { hashPassword } from "../src/common/password";
import { TOURNAMENT_DISCIPLINES } from "../src/tournaments/disciplines";
import { BracketGenerationService } from "../src/brackets/bracket-generation.service";
import { BracketMatchProgressionService } from "../src/brackets/match-progression.service";
import { BracketMatchesService } from "../src/brackets/bracket-matches.service";

const prisma = new PrismaClient();

class StubNotificationsService {
  async notifyMatchResult() {}
  async notifyTournamentCompletion() {}
}

class StubAuditService {
  async log() {}
}

const progressionService = new BracketMatchProgressionService(prisma as never);
const generationService = new BracketGenerationService(prisma as never, progressionService);
const matchesService = new BracketMatchesService(
  prisma as never,
  progressionService,
  new StubNotificationsService() as never,
  new StubAuditService() as never
);

type DemoDef = {
  id: string;
  title: string;
  system: "SINGLE_ELIMINATION" | "DOUBLE_ELIMINATION" | "ROUND_ROBIN" | "SWISS" | "GROUP_PLAYOFF";
  bracketFormat: "SINGLE_ELIMINATION" | "DOUBLE_ELIMINATION";
  bracketSize: number;
  players: number;
};

const DEMO_DEFS: DemoDef[] = [
  { id: "demo-single-8", title: "Demo · Single Elimination", system: "SINGLE_ELIMINATION", bracketFormat: "SINGLE_ELIMINATION", bracketSize: 8, players: 8 },
  { id: "demo-double-8", title: "Demo · Double Elimination", system: "DOUBLE_ELIMINATION", bracketFormat: "DOUBLE_ELIMINATION", bracketSize: 8, players: 8 },
  { id: "demo-round-robin-6", title: "Demo · Round Robin", system: "ROUND_ROBIN", bracketFormat: "SINGLE_ELIMINATION", bracketSize: 0, players: 6 },
  { id: "demo-swiss-8", title: "Demo · Swiss", system: "SWISS", bracketFormat: "SINGLE_ELIMINATION", bracketSize: 0, players: 8 },
  { id: "demo-group-playoff-8", title: "Demo · Group + Playoff", system: "GROUP_PLAYOFF", bracketFormat: "SINGLE_ELIMINATION", bracketSize: 0, players: 8 },
  { id: "demo-single-64", title: "Demo · Single Elimination · 64", system: "SINGLE_ELIMINATION", bracketFormat: "SINGLE_ELIMINATION", bracketSize: 64, players: 64 },
  { id: "demo-double-64", title: "Demo · Double Elimination · 64", system: "DOUBLE_ELIMINATION", bracketFormat: "DOUBLE_ELIMINATION", bracketSize: 64, players: 64 },
  { id: "demo-single-128", title: "Demo · Single Elimination · 128", system: "SINGLE_ELIMINATION", bracketFormat: "SINGLE_ELIMINATION", bracketSize: 128, players: 128 },
  { id: "demo-double-128", title: "Demo · Double Elimination · 128", system: "DOUBLE_ELIMINATION", bracketFormat: "DOUBLE_ELIMINATION", bracketSize: 128, players: 128 }
];

const DEMO_ORGANIZER_EMAIL = "demo.organizer@billuz.local";
const DEMO_PLAYER_POOL = 128;

async function deletePriorDemos() {
  const tournaments = await prisma.tournament.findMany({
    where: {
      OR: [
        { id: { startsWith: "demo-" } },
        { id: { startsWith: "qa-" } },
        { title: { startsWith: "Demo", mode: "insensitive" } },
        { title: { startsWith: "QA ", mode: "insensitive" } }
      ]
    },
    select: { id: true }
  });
  const ids = tournaments.map((tournament) => tournament.id);
  if (ids.length === 0) {
    return 0;
  }
  await prisma.$transaction([
    prisma.matchDispute.deleteMany({ where: { match: { tournamentId: { in: ids } } } }),
    prisma.bracketMatch.deleteMany({ where: { tournamentId: { in: ids } } }),
    prisma.bracketParticipant.deleteMany({ where: { tournamentId: { in: ids } } }),
    prisma.application.deleteMany({ where: { tournamentId: { in: ids } } }),
    prisma.tournament.deleteMany({ where: { id: { in: ids } } })
  ]);
  return ids.length;
}

async function ensureInfrastructure() {
  const country = await prisma.country.upsert({
    where: { code: "UZ" },
    update: { name: "Uzbekistan" },
    create: { code: "UZ", name: "Uzbekistan" }
  });
  const city = await prisma.city.upsert({
    where: { countryId_name: { countryId: country.id, name: "Tashkent" } },
    update: {},
    create: { countryId: country.id, name: "Tashkent" }
  });

  const disciplineName = TOURNAMENT_DISCIPLINES[0].name;
  const discipline = await prisma.discipline.upsert({
    where: { name: disciplineName },
    update: {},
    create: { name: disciplineName }
  });

  const passwordHash = await hashPassword("demo-password");
  const organizer = await prisma.user.upsert({
    where: { email: DEMO_ORGANIZER_EMAIL },
    update: { passwordHash, role: Role.ORGANIZER, isVerified: true },
    create: { email: DEMO_ORGANIZER_EMAIL, phone: "+998900000010", passwordHash, role: Role.ORGANIZER, isVerified: true }
  });

  const existingClub = await prisma.club.findFirst({ where: { name: "Demo Arena" } });
  const club = existingClub
    ? await prisma.club.update({
        where: { id: existingClub.id },
        data: { countryId: country.id, cityId: city.id, tables: 8, disciplines: [disciplineName], deletedAt: null }
      })
    : await prisma.club.create({
        data: {
          name: "Demo Arena",
          description: "Demo venue for bracket showcases",
          countryId: country.id,
          cityId: city.id,
          address: "Demo Street 1",
          phone: "+998900000011",
          telegram: "",
          tables: 8,
          disciplines: [disciplineName],
          workingHours: "10:00-23:00",
          onboardingCompletedAt: new Date(),
          latitude: 41.3,
          longitude: 69.24
        }
      });

  const players = [];
  for (let index = 1; index <= DEMO_PLAYER_POOL; index += 1) {
    const email = `demo.player${index}@billuz.local`;
    const user = await prisma.user.upsert({
      where: { email },
      update: { passwordHash, role: Role.PLAYER, isVerified: true },
      create: { email, phone: `+99890001${String(index).padStart(4, "0")}`, passwordHash, role: Role.PLAYER, isVerified: true }
    });
    const player = await prisma.player.upsert({
      where: { userId: user.id },
      update: {
        fullName: `Demo Player ${index}`,
        countryId: country.id,
        cityId: city.id,
        elo: 1000,
        wins: 0,
        losses: 0,
        levelPoints: 0,
        tournamentsPlayed: 0,
        tournamentWins: 0,
        level: "NOVICE",
        achievements: []
      },
      create: {
        userId: user.id,
        fullName: `Demo Player ${index}`,
        countryId: country.id,
        cityId: city.id,
        elo: 1000,
        wins: 0,
        losses: 0,
        levelPoints: 0,
        tournamentsPlayed: 0,
        tournamentWins: 0,
        level: "NOVICE",
        achievements: []
      }
    });
    players.push(player);
  }

  return { country, city, discipline, organizer, club, players };
}

const actorFor = (organizerId: string) => ({
  sub: organizerId,
  email: DEMO_ORGANIZER_EMAIL,
  role: "ORGANIZER" as const,
  type: "access" as const
});

async function playToCompletion(def: DemoDef, organizerId: string) {
  const actor = actorFor(organizerId);
  for (let guard = 0; guard < 5000; guard += 1) {
    const matches = await prisma.bracketMatch.findMany({
      where: { tournamentId: def.id },
      orderBy: [{ round: "asc" }, { matchNumber: "asc" }]
    });
    const ready = matches.find(
      (match) => match.status === "READY" && Boolean(match.player1Id) && Boolean(match.player2Id)
    );
    if (!ready) {
      break;
    }

    // The lower-bracket player wins the first double-elimination final to showcase the reset.
    const isFirstFinal =
      def.system === "DOUBLE_ELIMINATION" && ready.phase === "FINAL" && !ready.isThirdPlace && !ready.isFinalReset;
    const winnerId = isFirstFinal ? ready.player2Id! : ready.player1Id!;
    const player1Wins = winnerId === ready.player1Id;

    await matchesService.updateMatchResult(
      ready.id,
      { winnerId, player1Score: player1Wins ? 5 : 2, player2Score: player1Wins ? 2 : 5 },
      actor as never
    );
  }
}

async function buildDemo(def: DemoDef, ctx: Awaited<ReturnType<typeof ensureInfrastructure>>) {
  const startsAt = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
  await prisma.tournament.create({
    data: {
      id: def.id,
      title: def.title,
      clubId: ctx.club.id,
      disciplineId: ctx.discipline.id,
      organizerId: ctx.organizer.id,
      startsAt,
      prizePool: 0,
      status: TournamentStatus.REGISTRATION,
      participants: def.players,
      bracketSize: def.bracketSize,
      bracketFormat: def.bracketFormat,
      bracketSystem: def.system,
      participantSelectionMode: "DIRECT",
      tournamentType: "AMATEUR"
    }
  });

  for (let seed = 1; seed <= def.players; seed += 1) {
    const player = ctx.players[seed - 1];
    await prisma.bracketParticipant.create({
      data: {
        tournamentId: def.id,
        playerId: player.id,
        name: player.fullName,
        seed
      }
    });
  }

  await generationService.generate(def.id);
  await playToCompletion(def, ctx.organizer.id);

  const finalState = await prisma.tournament.findUnique({ where: { id: def.id }, select: { status: true } });
  const matchCount = await prisma.bracketMatch.count({ where: { tournamentId: def.id } });
  const finishedCount = await prisma.bracketMatch.count({ where: { tournamentId: def.id, status: "FINISHED" } });
  return { id: def.id, status: finalState?.status, matchCount, finishedCount };
}

async function main() {
  const deleted = await deletePriorDemos();
  const ctx = await ensureInfrastructure();

  const summary = [];
  for (const def of DEMO_DEFS) {
    summary.push(await buildDemo(def, ctx));
  }

  console.log(
    JSON.stringify(
      {
        status: "ok",
        deletedTournaments: deleted,
        organizer: DEMO_ORGANIZER_EMAIL,
        password: "demo-password",
        demos: summary
      },
      null,
      2
    )
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
