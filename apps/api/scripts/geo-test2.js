const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";
const H = { "User-Agent": UA, "Accept-Language": "ru,en;q=0.9", "Referer": "https://www.openstreetmap.org/" };

async function get(url) {
  const res = await fetch(url, { headers: H });
  const txt = await res.text();
  let d; try { d = JSON.parse(txt); } catch { d = null; }
  return Array.isArray(d) && d[0] ? `${(+d[0].lat).toFixed(5)},${(+d[0].lon).toFixed(5)}` : null;
}

// структурированный по улице, затем свободный по всей строке
async function geo(raw) {
  const m = raw.match(/(улица|проспект|проезд|шоссе)\s+([^,]+?),?\s*(\d+[А-Яа-я]?(?:\/\d+)?)/i);
  if (m) {
    const street = `${m[2].trim()} ${m[3]}`;
    const u = `https://nominatim.openstreetmap.org/search?street=${encodeURIComponent(street)}&city=${encodeURIComponent("Ташкент")}&country=${encodeURIComponent("Узбекистан")}&format=json&limit=1&accept-language=ru`;
    const r = await get(u);
    if (r) return r + "  [street]";
  }
  const u2 = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(raw + ", Ташкент, Узбекистан")}&format=json&limit=1&accept-language=ru`;
  const r2 = await get(u2);
  return r2 ? r2 + "  [free]" : null;
}

const tests = [
  "Ташкент, улица Бабура, 67",
  "Ташкент, улица Янги Куйлюк, 52",
  "Ташкент, улица Домбрабад, 83",
  "Ташкент, улица Исмаилата, 39",
  "Ташкент, улица Кичик Бешагач, 104Б",
  "Ташкент, проспект Бектемир, 126",
  "Ташкент, Юнусабадский район, массив Юнусабад, 10-й квартал, 1Б",
  "Ташкент, Чиланзарский район, массив Чиланзар, 5-й квартал, 50В",
];
(async () => {
  for (const q of tests) {
    const r = await geo(q);
    console.log(r ? "✓" : "✗", q, "->", r || "—");
    await sleep(1500);
  }
})();
