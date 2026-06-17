/**
 * Импорт бильярдных Ташкента из списка адресов (выгрузка из карт).
 * Геокодирование — OpenStreetMap Nominatim (бесплатно, без ключа).
 * Уже существующие клубы (source='web') не трогаем; эти идут под source='web-list'.
 *
 * Запуск:  node apps/api/scripts/seed-clubs-from-list.js
 */
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const SOURCE = "web-list";

// Адреса (уже почищены от меток TG; адреса, совпадающие с существующими 15, исключены).
const RAW = [
  "Ташкент, 7-й проезд Кулолкургон",
  "Ташкент, Юнусабадский район, массив Юнусабад, 10-й квартал, 1Б",
  "Ташкент, улица Уч Кахрамон, 12А",
  "Ташкент, Юнусабадский район, 15-й квартал, 43А",
  "Ташкент, улица Дехконабад",
  "Ташкент, Юнусабадский район, массив Юнусабад, 19-й квартал, 45",
  "Ташкент, Юнусабадский район, улица Актепа, 49А",
  "Ташкент, Юнусабадский район, Шоштепа",
  "Ташкент, Юнусабадский район, улица Богишамол, 229",
  "Ташкентская область, Кибрайский район, городской посёлок Салар, 1",
  "Ташкент, улица Исмаилата, 39",
  "Ташкент, улица Янги Куйлюк, 52",
  "Ташкент, улица Домбрабад, 83",
  "Ташкент, улица Мирзо Улугбека, 2",
  "Ташкент, Бектемирский район, улица Хусейна Байкары, 36",
  "Ташкент, Сергелийский район, 1-й проезд Ханабадтепа, 121",
  "Ташкент, Сергелийский район, улица Обихаёт, 3",
  "Ташкент, Янгихаётский район, улица Кипчак, 1А",
  "Ташкент, Сергелийский район, Нилуфар",
  "Ташкент, Янгихаётский район, массив Узгарыш, 2",
  "Ташкент, Сергелийский район, массив Сергели-I, 36",
  "Ташкент, Янгихаётский район, квартал Сергели-14Б, 185А",
  "Ташкентская область, Зангиатинский район, улица Абдулла Кодирий, 34",
  "Ташкент, Янгихаётский район, улица Бог",
  "Ташкент, Янгихаётский район, улица Юксалиш, 75А",
  "Ташкент, Юкарычирчикский район, Янгихаёт",
  "Ташкент, Сергелийский район, улица Мирзы Турсунзаде, 1",
  "Ташкент, Сергелийский район, массив Сергели-V, 6А",
  "Ташкент, Сергелийский район, улица Янги Сергели, 42",
  "Ташкент, проспект Бектемир, 126",
  "Ташкент, улица Хусейна Байкары",
  "Ташкент, Яшнабадский район, Донишманд",
  "Ташкент, Бектемирский район, улица Тараккиёт, 1",
  "Ташкент, Яшнабадский район, улица Авиасозлар, 128",
  "Ташкент, Яшнабадский район, улица Авиасозлар, 59",
  "Ташкент, улица Паркент, 176",
  "Ташкент, Яшнабадский район, Семург",
  "Ташкент, Мирзо-Улугбекский район, 2-й проезд Бунёдкорлик, 1",
  "Ташкент, Мирзо-Улугбекский район, Чимён",
  "Ташкент, Мирзо-Улугбекский район, массив Городок Тракторостроителей, 4-й квартал, 27А",
  "Ташкентская область, Кибрайский район, городской посёлок Салар, Университетская улица, 297",
  "Ташкент, Мирабадский район, улица Гейдара Алиева, 182",
  "Ташкент, улица Кичик Бешагач, 104Б",
  "Ташкент, улица Бабура, 67",
  "Ташкент, Чиланзарский район, улица Арнасай, 6А",
  "Ташкент, улица Имама ат-Термези, 71",
  "Ташкент, улица Кичик Мирабад, 6",
  "Ташкент, Мирзо-Улугбекский район, массив Ц-1 Буюк Ипак Йули, 13",
  "Ташкент, улица Лабзак, 2А",
  "Ташкент, улица Фурката, 15/1",
  "Ташкент, Алмазарский район, 2-й проезд Ахунгузар, 28",
  "Ташкент, улица Лабзак, 12",
  "Ташкент, Park City Olmazor",
  "Ташкент, улица Алтынсай, 4",
  "Ташкент, Чиланзарский район, массив Чиланзар, 5-й квартал, 50В",
  "Ташкент, улица Катартал",
  "Ташкент, улица Ширин, 27",
  "Ташкент, Чиланзарский район, улица Аль-Хорезми, 66/8",
  "Ташкент, Чиланзарский район, массив Чиланзар, квартал 20А, 42А",
  "Ташкент, Учтепинский район, массив Чиланзар, 12-й квартал, 17",
  "Ташкент, Учтепинский район, массив Чиланзар, 24-й квартал, 8А",
  "Ташкент, Юнусабадский район, улица Ёшлик, 2",
  "Ташкент, Учтепинский район, Хамдуст",
  "Ташкент, Учтепинский район, Алихонтура Согуний",
  "Ташкент, улица Сугалли-ота",
  "Ташкент, улица Заргарлик, 30А",
  "Ташкент, улица Ковунчи, 11А",
  "Ташкент, Учтепинский район, Диёрабад",
  "Ташкентская область, Зангиатинский район, улица Мустакиллик, 30",
  "Ташкент, Учтепинский район, массив Чиланзар, 23-й квартал, 68А",
  "Ташкент, Учтепинский район, Малая кольцевая дорога",
  "Ташкент, улица Кукча Дарвоза, 487",
  "Ташкент, Чиланзарский район, улица Асрлар Садоси, 2",
  "Ташкент, улица Курганча, 48",
  "Ташкентская область, Юкарычирчикский район, улица Зебузар",
  "Ташкентская область, Кибрайский район, 3-й тупик Лолазор, 57",
  "Ташкентская область, Кибрайский район, улица Окибат, 189",
  "Ташкент, Шайхантахурский район, Малая кольцевая дорога, 2А",
  "Ташкент, улица Паркент, 227",
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function extractDistrict(raw) {
  const m = raw.match(/([А-Яа-яёЁ-]+ский)\s+район/);
  return m ? `${m[1]} район` : null;
}

function deriveName(raw) {
  let s = raw
    .replace(/^Ташкентская область,\s*/i, "")
    .replace(/^Ташкент,\s*/i, "")
    .replace(/[А-Яа-яёЁ-]+ский район,\s*/i, "")
    .replace(/махаллинский сход граждан\s*/gi, "")
    .replace(/городской посёлок\s*/gi, "")
    .replace(/массив\s*/gi, "")
    .replace(/^улица\s*/i, "")
    .replace(/\s+/g, " ")
    .trim();
  if (s.length > 48) s = s.slice(0, 48).trim() + "…";
  return "Бильярд · " + s;
}

const GEO_HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
  "Accept-Language": "ru,en;q=0.9",
  Referer: "https://www.openstreetmap.org/",
};

async function nominatim(url) {
  try {
    const res = await fetch(url, { headers: GEO_HEADERS });
    if (!res.ok) return null;
    const data = await res.json();
    if (!Array.isArray(data) || data.length === 0) return null;
    const lat = Number(data[0].lat);
    const lon = Number(data[0].lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
    return { lat, lon, suspect: lat < 40.7 || lat > 41.7 || lon < 68.7 || lon > 70.0 };
  } catch {
    return null;
  }
}

async function geocode(raw) {
  const base = "https://nominatim.openstreetmap.org/search?format=json&limit=1&accept-language=ru";
  const m = raw.match(/(улица|проспект|проезд|шоссе)\s+([^,]+?),?\s*(\d+[А-Яа-яЁё]?(?:\/\d+)?)/i);
  // 1) структурированный запрос по улице + дому
  if (m) {
    const street = `${m[2].trim()} ${m[3]}`;
    const r = await nominatim(`${base}&street=${encodeURIComponent(street)}&city=${encodeURIComponent("Ташкент")}&country=${encodeURIComponent("Узбекистан")}`);
    if (r) return r;
    await sleep(1100);
    // 2) только улица без дома
    const r2 = await nominatim(`${base}&street=${encodeURIComponent(m[2].trim())}&city=${encodeURIComponent("Ташкент")}&country=${encodeURIComponent("Узбекистан")}`);
    if (r2) return r2;
    await sleep(1100);
  }
  // 3) свободный запрос по самому конкретному ориентиру (массив / МСГ / улица)
  const locality = raw
    .replace(/^Ташкент(ская область)?,\s*/i, "")
    .replace(/[А-Яа-яЁё-]+ский район,\s*/i, "")
    .replace(/махаллинский сход граждан\s*/gi, "")
    .replace(/\s*•.*$/, "")
    .trim();
  return nominatim(`${base}&q=${encodeURIComponent(locality + ", Ташкент, Узбекистан")}`);
}

async function main() {
  const country = await prisma.country.findFirst({ where: { code: "UZ" } });
  const city = await prisma.city.findFirst({ where: { countryId: country.id, name: "Tashkent" } });

  // идемпотентность: пересоздаём только web-list, существующие (web) не трогаем
  const stale = await prisma.club.findMany({ where: { source: SOURCE }, select: { id: true } });
  if (stale.length) {
    const ids = stale.map((c) => c.id);
    await prisma.clubTable.deleteMany({ where: { clubId: { in: ids } } });
    await prisma.club.deleteMany({ where: { id: { in: ids } } });
    console.log(`Удалено прежних web-list: ${ids.length}`);
  }

  let ok = 0, nogeo = 0, suspect = 0;
  for (let i = 0; i < RAW.length; i++) {
    const raw = RAW[i];
    const geo = await geocode(raw);
    await sleep(1100); // лимит Nominatim ~1 req/sec
    if (geo?.suspect) suspect++;
    if (!geo) nogeo++; else ok++;
    await prisma.club.create({
      data: {
        source: SOURCE,
        sourceId: `list:${i + 1}`,
        name: deriveName(raw),
        countryId: country.id,
        cityId: city.id,
        address: raw.replace(/^Ташкент,\s*/, "").replace(/^Ташкентская область,\s*/, "обл.: "),
        district: extractDistrict(raw),
        phone: null,
        telegram: "",
        workingHours: null,
        tables: 0,
        disciplines: [],
        services: [],
        latitude: geo?.lat ?? null,
        longitude: geo?.lon ?? null,
        lat: geo?.lat ?? null,
        lng: geo?.lon ?? null,
        reviewsCount: 0,
        isVerified: false,
        onboardingCompletedAt: new Date(),
      },
    });
    const tag = !geo ? "✗ нет коорд" : geo.suspect ? "⚠ вне Ташкента" : "✓";
    console.log(`${String(i + 1).padStart(2)} ${tag}  ${deriveName(raw)}`);
  }

  console.log(`\nИтого: добавлено ${RAW.length} | с координатами ${ok} | без ${nogeo} | подозрительных ${suspect}`);
}

main()
  .catch((e) => { console.error("Ошибка:", e); process.exit(1); })
  .finally(() => prisma.$disconnect());
