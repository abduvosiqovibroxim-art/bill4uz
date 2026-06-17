const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const tests = [
  "Ташкент, улица Бабура, 67",
  "Ташкент, улица Лабзак, 12",
  "Ташкент, улица Янги Куйлюк, 52",
  "Ташкент, улица Домбрабад, 83",
  "Ташкент, улица Исмаилата, 39",
];
async function geo(q) {
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q + ", Узбекистан")}&format=json&limit=1&accept-language=ru`;
  const res = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
      "Accept-Language": "ru,en;q=0.9",
      "Referer": "https://www.openstreetmap.org/",
    },
  });
  const txt = await res.text();
  let data; try { data = JSON.parse(txt); } catch { data = null; }
  return { status: res.status, found: Array.isArray(data) && data.length > 0, sample: Array.isArray(data) && data[0] ? `${data[0].lat},${data[0].lon}` : txt.slice(0, 80) };
}
(async () => {
  for (const q of tests) {
    const r = await geo(q);
    console.log(r.found ? "✓" : "✗", r.status, q, "->", r.sample);
    await sleep(2000);
  }
})();
