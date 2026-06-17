/**
 * Сид реальных бильярдных клубов Ташкента.
 * Источники: Yandex Maps, Golden Pages, 2GIS, Yellow Pages, сайты клубов (июнь 2026).
 * Телефоны, которые в каталогах скрыты, оставлены null — НЕ выдумываются.
 *
 * Запуск (внутри контейнера billiard_api):
 *   node apps/api/scripts/seed-real-clubs-tashkent.js
 */
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const SOURCE = "web";

// disciplines: pool = американский пул, pyramid = русская пирамида, snooker = снукер
const CLUBS = [
  {
    sourceId: "yandex:239042046229",
    name: "Black Pool",
    address: "ул. Истикбол, 8",
    district: "Мирабадский",
    phone: "+998 97 710 05 20",
    workingHours: "10:00–02:00",
    lat: 41.307792, lng: 69.282531,
    tables: 20,
    disciplines: ["pool", "pyramid", "snooker"],
    rating: 5.0, reviewsCount: 542,
  },
  {
    sourceId: "yandex:42029822558",
    name: "Diamond Ball",
    address: "ул. Фирдавси, 25",
    district: "Юнусабадский",
    phone: "+998 55 518 18 54, +998 71 234 57 68, +998 71 234 67 98",
    workingHours: "10:00–03:00",
    lat: 41.332605, lng: 69.294612,
    tables: 19,
    disciplines: ["pyramid", "pool"],
    rating: 5.0, reviewsCount: 325,
  },
  {
    sourceId: "gp:110155",
    name: "Majestic",
    address: "ул. Исламабад, 1А",
    district: "Юнусабадский",
    phone: "+998 98 717 08 08, +998 97 704 05 54",
    workingHours: "11:00–01:00",
    tables: 0,
    disciplines: ["pool", "pyramid"],
  },
  {
    sourceId: "gp:102160",
    name: "Start Classic",
    address: "кв-л Юнусабад-16, 19",
    district: "Юнусабадский",
    phone: "+998 71 220 10 01, +998 95 600 00 70, +998 71 220 00 57",
    workingHours: "10:00–00:00",
    tables: 0,
    disciplines: ["pool", "pyramid"],
  },
  {
    sourceId: "gp:42930",
    name: "Bizon",
    address: "м-в Авиасозлар-2, 53",
    district: "Яшнабадский",
    phone: "+998 71 294 25 94",
    workingHours: "11:00–23:00",
    tables: 0,
    disciplines: ["pool", "pyramid"],
  },
  {
    sourceId: "yandex:162570022285",
    name: "Star Snooker",
    address: "обводная ул. Нурафшон, 1",
    district: "Шайхонтохурский",
    phone: "+998 97 800 07 38",
    workingHours: "13:00–03:00",
    lat: 41.325177, lng: 69.212300,
    tables: 0,
    disciplines: ["snooker", "pool"],
    rating: 4.9, reviewsCount: 72,
  },
  {
    sourceId: "yandex:200746639621",
    name: "Qorasuv Bilyard",
    address: "м-в Карасу-6, 18B",
    district: "Мирзо-Улугбекский",
    phone: "+998 94 654 65 94",
    workingHours: "11:00–23:00",
    lat: 41.321235, lng: 69.355061,
    tables: 0,
    disciplines: ["pool", "pyramid"],
  },
  {
    sourceId: "gp:58936",
    name: "Elite Club",
    address: "Ахангаранское шоссе, м-в Авиасозлар-4, 41А",
    district: "Яшнабадский",
    phone: "+998 71 296 23 24, +998 71 296 85 38, +998 90 920 25 25",
    workingHours: "12:00–03:00",
    tables: 0,
    disciplines: ["pool", "pyramid"],
  },
  {
    sourceId: "underball",
    name: "Underball",
    address: "Чиланзар, 18 квартал, 9/1",
    district: "Чиланзарский",
    phone: "+998 90 817 78 16",
    workingHours: null,
    tables: 6,
    disciplines: ["pool", "pyramid"],
  },
  // Реальные клубы, но телефоны в каталогах скрыты -> null
  {
    sourceId: "gp:royal",
    name: "Royal",
    address: "ул. Дурмон Йули, 14А",
    district: "Мирзо-Улугбекский",
    phone: null,
    workingHours: "11:00–03:00",
    tables: 0,
    disciplines: ["pool", "pyramid"],
  },
  {
    sourceId: "gp:qushbegi",
    name: "Qushbegi",
    address: "м-в Кушбеги, 3А",
    district: "Яккасарайский",
    phone: null,
    workingHours: "11:00–02:00",
    tables: 0,
    disciplines: ["pool", "pyramid"],
  },
  {
    sourceId: "gp:tashkent-snooker",
    name: "Tashkent Snooker",
    address: "ул. Мукими, 1А (4 этаж)",
    district: "Яккасарайский",
    phone: "+998 90 015 00 58",
    workingHours: "13:00–02:00",
    lat: 41.278804, lng: 69.243633,
    tables: 0,
    disciplines: ["snooker"],
  },
  {
    sourceId: "gp:ruptur",
    name: "Ruptur",
    address: "ул. М.Таробий, 33А",
    district: "Яккасарайский",
    phone: null,
    workingHours: "Круглосуточно",
    tables: 0,
    disciplines: ["pool", "pyramid"],
  },
  {
    sourceId: "gp:naqqosh",
    name: "Naqqosh",
    address: "пр-д 4-й Домбрабад, 16/1",
    district: "Чиланзарский",
    phone: "+998 93 571 31 11, +998 71 279 43 36",
    workingHours: "11:00–23:00",
    tables: 0,
    disciplines: ["pool", "pyramid"],
  },
  {
    sourceId: "gp:shirinabonu",
    name: "Shirinabonu",
    address: "Чиланзар-24, ул. Лутфи, 13А",
    district: "Учтепинский",
    phone: null,
    workingHours: "10:00–06:00",
    tables: 0,
    disciplines: ["pool", "pyramid"],
  },
];

async function main() {
  const country = await prisma.country.findFirst({ where: { code: "UZ" } });
  if (!country) throw new Error("Country UZ not found");
  const city = await prisma.city.findFirst({
    where: { countryId: country.id, name: "Tashkent" },
  });
  if (!city) throw new Error("City Tashkent not found");

  // 1) Удалить старые фейковые (manual) и предыдущие web-импорты, чтобы скрипт был идемпотентным
  const stale = await prisma.club.findMany({
    where: { source: { in: ["manual", SOURCE] } },
    select: { id: true },
  });
  const staleIds = stale.map((c) => c.id);
  if (staleIds.length) {
    await prisma.clubTable.deleteMany({ where: { clubId: { in: staleIds } } });
    await prisma.club.deleteMany({ where: { id: { in: staleIds } } });
    console.log(`Удалено старых клубов: ${staleIds.length}`);
  }

  // 2) Создать реальные
  let created = 0;
  for (const c of CLUBS) {
    await prisma.club.create({
      data: {
        source: SOURCE,
        sourceId: c.sourceId,
        name: c.name,
        countryId: country.id,
        cityId: city.id,
        address: c.address,
        district: c.district ?? null,
        phone: c.phone ?? null,
        telegram: "",
        workingHours: c.workingHours ?? null,
        tables: c.tables ?? 0,
        disciplines: c.disciplines ?? [],
        services: [],
        latitude: c.lat ?? null,
        longitude: c.lng ?? null,
        lat: c.lat ?? null,
        lng: c.lng ?? null,
        rating: c.rating ?? null,
        reviewsCount: c.reviewsCount ?? 0,
        isVerified: false,
        onboardingCompletedAt: new Date(), // чтобы клуб отображался в публичном списке
      },
    });
    created += 1;
    console.log(`+ ${c.name}${c.phone ? " (" + c.phone + ")" : " (тел. неизвестен)"}`);
  }

  console.log(`\nГотово. Добавлено реальных клубов: ${created}`);
}

main()
  .catch((e) => {
    console.error("Ошибка:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
