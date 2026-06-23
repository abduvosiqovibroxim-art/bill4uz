import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const SOURCE = "BILL4YOU";
const BASE = "https://bill4you.pro/api/v2/clubs";

// ISO country code -> display name. Unknown codes fall back to the code itself.
const COUNTRY_NAMES: Record<string, string> = {
  RU: "Russia",
  UZ: "Uzbekistan",
  KZ: "Kazakhstan",
  KG: "Kyrgyzstan",
  TJ: "Tajikistan",
  TM: "Turkmenistan",
  BY: "Belarus",
  UA: "Ukraine",
  AZ: "Azerbaijan",
  AM: "Armenia",
  GE: "Georgia",
  MD: "Moldova",
  RS: "Serbia",
  EE: "Estonia",
  LV: "Latvia",
  LT: "Lithuania",
  PL: "Poland",
  DE: "Germany",
  FI: "Finland",
  TR: "Turkey",
  AE: "United Arab Emirates",
  US: "United States",
  GB: "United Kingdom",
  CN: "China",
  MN: "Mongolia"
};

type B4Club = {
  id: number;
  name: string;
  link?: string;
  img?: string | null;
  address?: string | null;
  tel?: string | null;
  coordinates?: [string | number | null, string | number | null] | null;
  countryCode?: string | null;
};

// bill4you's coordinate order is inconsistent ([lat,lng] for most, [lng,lat] for some).
// Country bounding boxes [latMin, latMax, lngMin, lngMax] let us detect and fix swaps.
const BBOX: Record<string, [number, number, number, number]> = {
  RU: [41, 82, 19, 180],
  KZ: [40, 56, 46, 88],
  KG: [39, 43.5, 69, 80.5],
  UZ: [37, 45.7, 55, 73.3],
  BY: [51, 56.3, 23, 33],
  EE: [57.5, 59.9, 21.5, 28.3],
  RS: [42, 46.3, 18.8, 23.1],
  AZ: [38.3, 41.95, 44.7, 50.6],
  TH: [5.6, 20.5, 97.3, 105.7],
  TJ: [36.6, 41.1, 67.3, 75.2],
  DE: [47.2, 55.1, 5.8, 15.1],
  GB: [49.8, 60.9, -8.7, 1.8],
  AE: [22.6, 26.1, 51, 56.5],
  CN: [18, 53.6, 73.5, 135.1],
  KR: [33, 38.7, 124.5, 131],
  ES: [36, 43.8, -9.4, 4.4],
  EG: [22, 31.7, 24.7, 36.9],
  ID: [-11, 6.1, 95, 141],
  AM: [38.8, 41.3, 43.4, 46.6],
  TM: [35.1, 42.8, 52.4, 66.7],
  MA: [21, 36, -17.1, -1]
};

// Returns [latitude, longitude], swapping only when the source order clearly falls
// outside the country box but the swapped order falls inside it.
function correctCoordinates(a: number | null, b: number | null, code: string): [number | null, number | null] {
  if (a === null || b === null) {
    return [a, b];
  }
  const box = BBOX[code.toUpperCase()];
  if (box) {
    const [latMin, latMax, lngMin, lngMax] = box;
    const inBox = (v: number, min: number, max: number) => v >= min && v <= max;
    const direct = inBox(a, latMin, latMax) && inBox(b, lngMin, lngMax);
    const swapped = inBox(b, latMin, latMax) && inBox(a, lngMin, lngMax);
    if (swapped && !direct) {
      return [b, a];
    }
  }
  return [a, b];
}

// Administrative region segments to skip when picking the city. Covers oblasts/krais,
// republics, autonomous okrugs/communities, Estonian uyezds, etc.
const REGION_RE = /(област|\bкрай\b|респ|вилоят|облыс|region|oblast|county|уезд|автономн|округ|сообщество)/i;
// Uppercase region abbreviations — JS \b is ASCII-only and fails on Cyrillic, so use explicit separators.
const REGION_ABBR_RE = /(^|[\s,\-—])(ХМАО|ЯНАО|НАО|ДНР|ЛНР|ЕАО)($|[\s,\-—])/;
// Settlement-type prefixes that precede the real place name ("посёлок городского типа Яя" -> "Яя").
const SETTLEMENT_PREFIX_RE =
  /^(пос[её]лок городского типа|городской пос[её]лок|рабочий пос[её]лок|пос[её]лок станции|пос[её]лок при станции|пос[её]лок|город республиканского подчинения|город|село|деревня|станица|хутор|аул|микрорайон|пгт\.?|г\.|с\.|д\.)\s+/i;

function cleanCity(name: string): string {
  let current = name.trim();
  let previous = "";
  while (current && current !== previous) {
    previous = current;
    current = current.replace(SETTLEMENT_PREFIX_RE, "").trim();
  }
  return current || name;
}

function parseLocation(address: string | null | undefined): { region: string | null; city: string } {
  const parts = (address || "")
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);

  if (parts.length === 0) {
    return { region: null, city: "—" };
  }
  // parts[0] is the country in bill4you's format — drop it for city detection.
  let rest = parts.slice(1);
  if (rest.length === 0) {
    rest = parts;
  }

  let region: string | null = null;
  const regionIdx = rest.findIndex((part) => REGION_RE.test(part) || REGION_ABBR_RE.test(part));
  if (regionIdx >= 0) {
    region = rest[regionIdx];
    rest = rest.slice(regionIdx + 1);
  }

  const rawCity = (rest[0] || parts[parts.length - 1] || "—").slice(0, 120);
  return { region, city: cleanCity(rawCity) };
}

function num(value: string | number | null | undefined): number | null {
  if (value === null || value === undefined || value === "") {
    return null;
  }
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

async function fetchPage(page: number): Promise<{ items: B4Club[]; pageCount: number }> {
  const response = await fetch(`${BASE}?page=${page}`, {
    headers: { Accept: "application/json", "User-Agent": "billuz-import/1.0" }
  });
  if (!response.ok) {
    throw new Error(`bill4you page ${page} -> HTTP ${response.status}`);
  }
  const data = (await response.json()) as { items?: B4Club[]; _meta?: { pageCount?: number } };
  return { items: data.items ?? [], pageCount: data._meta?.pageCount ?? page };
}

async function main() {
  const countryCache = new Map<string, string>(); // code -> countryId
  const cityCache = new Map<string, string>(); // countryId|city -> cityId

  async function ensureCountry(code: string): Promise<string> {
    const normalized = (code || "XX").toUpperCase();
    const cached = countryCache.get(normalized);
    if (cached) {
      return cached;
    }
    const country = await prisma.country.upsert({
      where: { code: normalized },
      update: {},
      create: { code: normalized, name: COUNTRY_NAMES[normalized] ?? normalized }
    });
    countryCache.set(normalized, country.id);
    return country.id;
  }

  async function ensureCity(countryId: string, name: string): Promise<string> {
    const key = `${countryId}|${name}`;
    const cached = cityCache.get(key);
    if (cached) {
      return cached;
    }
    const city = await prisma.city.upsert({
      where: { countryId_name: { countryId, name } },
      update: {},
      create: { countryId, name }
    });
    cityCache.set(key, city.id);
    return city.id;
  }

  const first = await fetchPage(1);
  const pageCount = first.pageCount;
  let all: B4Club[] = [...first.items];
  for (let page = 2; page <= pageCount; page += 1) {
    const { items } = await fetchPage(page);
    all = all.concat(items);
  }

  let added = 0;
  let updated = 0;
  let skipped = 0;
  const byCountry: Record<string, number> = {};

  for (const club of all) {
    if (!club.id || !club.name?.trim()) {
      skipped += 1;
      continue;
    }
    const code = (club.countryCode || "XX").toUpperCase();
    const countryId = await ensureCountry(code);
    const { region, city } = parseLocation(club.address);
    const cityId = await ensureCity(countryId, city);

    const [lat, lng] = correctCoordinates(num(club.coordinates?.[0]), num(club.coordinates?.[1]), code);

    const data = {
      source: SOURCE,
      sourceId: String(club.id),
      name: club.name.trim().slice(0, 200),
      countryId,
      cityId,
      address: (club.address || "—").trim().slice(0, 300),
      region,
      phone: club.tel?.trim() || null,
      coverUrl: club.img || null,
      latitude: lat,
      longitude: lng,
      lat,
      lng,
      onboardingCompletedAt: new Date(),
      deletedAt: null
    };

    const existing = await prisma.club.findFirst({
      where: { source: SOURCE, sourceId: String(club.id) },
      select: { id: true }
    });

    if (existing) {
      await prisma.club.update({ where: { id: existing.id }, data });
      updated += 1;
    } else {
      await prisma.club.create({
        data: { ...data, telegram: "", tables: 0, disciplines: [], services: [] }
      });
      added += 1;
    }
    byCountry[code] = (byCountry[code] ?? 0) + 1;
  }

  console.log(
    JSON.stringify(
      { status: "ok", source: SOURCE, fetched: all.length, added, updated, skipped, byCountry },
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
