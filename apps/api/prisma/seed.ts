import { PrismaClient } from "@prisma/client";
import { TOURNAMENT_DISCIPLINE_NAMES } from "../src/tournaments/disciplines";

const prisma = new PrismaClient();

const countries = [{ code: "UZ", name: "Uzbekistan" }] as const;

const citiesByCountry: Record<string, readonly string[]> = {
  UZ: ["Tashkent", "Samarkand", "Bukhara", "Andijan", "Namangan", "Fergana", "Nukus"]
};

async function main() {
  const countryIds = new Map<string, string>();

  for (const country of countries) {
    const record = await prisma.country.upsert({
      where: { code: country.code },
      update: { name: country.name },
      create: { code: country.code, name: country.name }
    });
    countryIds.set(country.code, record.id);
  }

  for (const [countryCode, cityNames] of Object.entries(citiesByCountry)) {
    const countryId = countryIds.get(countryCode);
    if (!countryId) {
      continue;
    }

    for (const cityName of cityNames) {
      await prisma.city.upsert({
        where: {
          countryId_name: {
            countryId,
            name: cityName
          }
        },
        update: {},
        create: {
          name: cityName,
          countryId
        }
      });
    }
  }

  for (const name of TOURNAMENT_DISCIPLINE_NAMES) {
    await prisma.discipline.upsert({
      where: { name },
      update: {},
      create: { name }
    });
  }

  console.log(
    JSON.stringify(
      {
        status: "ok",
        countries: await prisma.country.count(),
        cities: await prisma.city.count(),
        disciplines: await prisma.discipline.count()
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
