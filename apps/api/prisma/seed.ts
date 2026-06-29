import { PrismaClient, Role } from "@prisma/client";
import { hashPassword } from "../src/common/password";
import { TOURNAMENT_DISCIPLINE_NAMES } from "../src/tournaments/disciplines";

const prisma = new PrismaClient();

const adminEmail = "admin@billuz.local";
const adminPassword = "admin_t0la6an";

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

  // Platform admin account (access to /dashboard/admin). Idempotent by email.
  const adminPasswordHash = await hashPassword(adminPassword);
  await prisma.user.upsert({
    where: { email: adminEmail },
    update: { passwordHash: adminPasswordHash, role: Role.ADMIN, isVerified: true },
    create: { email: adminEmail, passwordHash: adminPasswordHash, role: Role.ADMIN, isVerified: true }
  });

  // Themed media galleries shown on /media. Each gallery holds distinct photos.
  // Cover = first asset url; first asset type drives the badge
  // (video -> highlights, image -> report, other -> interview).
  const mediaGalleries: { id: string; title: string; assets: { url: string; type: string }[] }[] = [
    {
      id: "seed-media-final",
      title: "Финал турнира",
      assets: [
        { url: "/media/tournament.webp", type: "video" },
        { url: "/media/tournament-2.webp", type: "image" },
        { url: "/media/tournament-3.webp", type: "video" },
        { url: "/media/tournament-4.webp", type: "image" },
        { url: "/media/tournament-5.webp", type: "video" }
      ]
    },
    {
      id: "seed-media-pyramid",
      title: "Русская пирамида",
      assets: [
        { url: "/media/pyramid.webp", type: "image" },
        { url: "/media/pyramid-2.webp", type: "image" },
        { url: "/media/pyramid-3.webp", type: "video" },
        { url: "/media/pyramid-4.webp", type: "image" }
      ]
    },
    {
      id: "seed-media-snooker",
      title: "Снукер: решающий фрейм",
      assets: [
        { url: "/media/snooker.webp", type: "video" },
        { url: "/media/snooker-2.webp", type: "image" },
        { url: "/media/snooker-3.webp", type: "video" },
        { url: "/media/snooker-4.webp", type: "image" },
        { url: "/media/snooker-5.webp", type: "video" },
        { url: "/media/snooker-6.webp", type: "image" }
      ]
    },
    {
      id: "seed-media-pool",
      title: "Пул: брейк",
      assets: [
        { url: "/media/pool.webp", type: "image" },
        { url: "/media/pool-2.webp", type: "image" },
        { url: "/media/pool-3.webp", type: "video" }
      ]
    },
    {
      id: "seed-media-awards",
      title: "Церемония награждения",
      assets: [
        { url: "/media/awards.webp", type: "interview" },
        { url: "/media/awards-2.webp", type: "image" }
      ]
    },
    {
      id: "seed-media-club",
      title: "Клубы и атмосфера",
      assets: [
        { url: "/media/club.webp", type: "image" },
        { url: "/media/club-2.webp", type: "image" },
        { url: "/media/club-3.webp", type: "image" },
        { url: "/media/club-4.webp", type: "image" },
        { url: "/media/club-5.webp", type: "image" },
        { url: "/media/club-6.webp", type: "video" },
        { url: "/media/club-7.webp", type: "image" }
      ]
    }
  ];

  for (const gallery of mediaGalleries) {
    await prisma.gallery.upsert({
      where: { id: gallery.id },
      update: { title: gallery.title },
      create: { id: gallery.id, title: gallery.title }
    });
    await prisma.mediaAsset.deleteMany({ where: { galleryId: gallery.id } });
    await prisma.mediaAsset.createMany({
      data: gallery.assets.map((asset) => ({ galleryId: gallery.id, url: asset.url, type: asset.type }))
    });
  }

  console.log(
    JSON.stringify(
      {
        status: "ok",
        countries: await prisma.country.count(),
        cities: await prisma.city.count(),
        disciplines: await prisma.discipline.count(),
        galleries: await prisma.gallery.count(),
        admin: adminEmail
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
