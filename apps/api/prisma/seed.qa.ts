import { PrismaClient, Role, TournamentStatus } from "@prisma/client";
import { hashPassword } from "../src/common/password";
import { TOURNAMENT_DISCIPLINES } from "../src/tournaments/disciplines";

const prisma = new PrismaClient();

const qaPassword = "qa-password";
const qaOrganizerEmail = "qa.organizer@billuz.local";
const qaPlayerEmail = (index: number) => `qa.player${index}@billuz.local`;
const qaPlayerPhone = (index: number) => `+99890000${String(index).padStart(4, "0")}`;

async function main() {
  if (process.env.NODE_ENV === "production") {
    console.warn("QA seed is disabled in production");
    return;
  }

  const country = await prisma.country.upsert({
    where: { code: "UZ" },
    update: { name: "Uzbekistan" },
    create: { code: "UZ", name: "Uzbekistan" }
  });

  const city = await prisma.city.upsert({
    where: {
      countryId_name: {
        countryId: country.id,
        name: "Tashkent"
      }
    },
    update: {},
    create: {
      countryId: country.id,
      name: "Tashkent"
    }
  });

  const disciplineName = TOURNAMENT_DISCIPLINES[0].name;
  const discipline = await prisma.discipline.upsert({
    where: { name: disciplineName },
    update: {},
    create: { name: disciplineName }
  });

  const passwordHash = await hashPassword(qaPassword);

  const organizer = await prisma.user.upsert({
    where: { email: qaOrganizerEmail },
    update: {
      passwordHash,
      role: Role.ORGANIZER,
      isVerified: true
    },
    create: {
      email: qaOrganizerEmail,
      phone: "+998900000000",
      passwordHash,
      role: Role.ORGANIZER,
      isVerified: true
    }
  });

  const existingPlace = await prisma.club.findFirst({ where: { name: "QA Billiard Place" } });
  const place = existingPlace
    ? await prisma.club.update({
        where: { id: existingPlace.id },
        data: {
          countryId: country.id,
          cityId: city.id,
          address: "QA Street 1",
          phone: "+998900009999",
          telegram: "",
          tables: 8,
          disciplines: [disciplineName],
          workingHours: "10:00-23:00",
          onboardingCompletedAt: new Date(),
          latitude: 41.2995,
          longitude: 69.2401,
          deletedAt: null
        }
      })
    : await prisma.club.create({
        data: {
          name: "QA Billiard Place",
          description: "QA-only billiard place for local tournament flow testing",
          countryId: country.id,
          cityId: city.id,
          address: "QA Street 1",
          phone: "+998900009999",
          telegram: "",
          tables: 8,
          disciplines: [disciplineName],
          workingHours: "10:00-23:00",
          onboardingCompletedAt: new Date(),
          latitude: 41.2995,
          longitude: 69.2401
        }
      });

  const players = [];
  for (let index = 1; index <= 8; index += 1) {
    const user = await prisma.user.upsert({
      where: { email: qaPlayerEmail(index) },
      update: {
        phone: qaPlayerPhone(index),
        passwordHash,
        role: Role.PLAYER,
        isVerified: true
      },
      create: {
        email: qaPlayerEmail(index),
        phone: qaPlayerPhone(index),
        passwordHash,
        role: Role.PLAYER,
        isVerified: true
      }
    });

    const player = await prisma.player.upsert({
      where: { userId: user.id },
      update: {
        fullName: `QA Player ${index}`,
        countryId: country.id,
        cityId: city.id,
        clubId: null,
        elo: 1000,
        wins: 0,
        losses: 0,
        levelPoints: 1,
        tournamentsPlayed: 1,
        tournamentWins: 0,
        level: "NOVICE",
        achievements: []
      },
      create: {
        userId: user.id,
        fullName: `QA Player ${index}`,
        countryId: country.id,
        cityId: city.id,
        clubId: null,
        elo: 1000,
        wins: 0,
        losses: 0,
        levelPoints: 1,
        tournamentsPlayed: 1,
        tournamentWins: 0,
        level: "NOVICE",
        achievements: []
      }
    });

    players.push(player);
  }

  const tournament = await prisma.tournament.upsert({
    where: { id: "qa-single-elimination-8" },
    update: {
      title: "QA Tournament Single Elimination",
      clubId: place.id,
      disciplineId: discipline.id,
      organizerId: organizer.id,
      startsAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      prizePool: 0,
      status: TournamentStatus.REGISTRATION,
      participants: players.length,
      bracketSize: 8,
      bracketFormat: "SINGLE_ELIMINATION",
      bracketSystem: "SINGLE_ELIMINATION",
      participantSelectionMode: "DIRECT",
      tournamentType: "AMATEUR",
      repeatEveryDays: null,
      repeatSpawnedAt: null
    },
    create: {
      id: "qa-single-elimination-8",
      title: "QA Tournament Single Elimination",
      clubId: place.id,
      disciplineId: discipline.id,
      organizerId: organizer.id,
      startsAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      prizePool: 0,
      status: TournamentStatus.REGISTRATION,
      participants: players.length,
      bracketSize: 8,
      bracketFormat: "SINGLE_ELIMINATION",
      bracketSystem: "SINGLE_ELIMINATION",
      participantSelectionMode: "DIRECT",
      tournamentType: "AMATEUR"
    }
  });

  await prisma.bracketMatch.deleteMany({ where: { tournamentId: tournament.id } });
  await prisma.bracketParticipant.deleteMany({ where: { tournamentId: tournament.id } });
  await prisma.application.deleteMany({ where: { tournamentId: tournament.id } });

  for (const [index, player] of players.entries()) {
    await prisma.application.create({
      data: {
        tournamentId: tournament.id,
        playerId: player.id,
        status: "APPROVED"
      }
    });

    await prisma.bracketParticipant.create({
      data: {
        tournamentId: tournament.id,
        playerId: player.id,
        name: player.fullName,
        seed: index + 1
      }
    });

    await prisma.ranking.upsert({
      where: {
        playerId_disciplineId_cityId: {
          playerId: player.id,
          disciplineId: discipline.id,
          cityId: player.cityId
        }
      },
      update: {
        points: player.levelPoints,
        position: index + 1
      },
      create: {
        playerId: player.id,
        disciplineId: discipline.id,
        cityId: player.cityId,
        points: player.levelPoints,
        position: index + 1
      }
    });
  }

  console.log(
    JSON.stringify(
      {
        status: "ok",
        warning: "QA seed is for local QA only",
        organizer: qaOrganizerEmail,
        password: qaPassword,
        tournamentId: tournament.id,
        place: place.name,
        players: players.map((player) => player.fullName)
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
