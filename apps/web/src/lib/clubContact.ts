import type { Club } from "@/lib/types";

export function hasClubCoordinates(club: Pick<Club, "latitude" | "longitude" | "lat" | "lng">) {
  return Number.isFinite(resolveClubLatitude(club)) && Number.isFinite(resolveClubLongitude(club));
}

export function resolveClubLatitude(club: Pick<Club, "latitude" | "lat">) {
  return typeof club.latitude === "number" ? club.latitude : club.lat;
}

export function resolveClubLongitude(club: Pick<Club, "longitude" | "lng">) {
  return typeof club.longitude === "number" ? club.longitude : club.lng;
}

export function splitPhones(phone: string | null | undefined): string[] {
  return (phone ?? "")
    .split(/[,;/]+/)
    .map((value) => value.trim())
    .filter(Boolean);
}

export function phoneHref(phone: string | null | undefined) {
  const first = splitPhones(phone)[0] ?? "";
  const normalized = first.replace(/[^\d+]/g, "");
  return normalized ? `tel:${normalized}` : null;
}

export function telegramHref(telegram: string | null | undefined) {
  const value = (telegram ?? "").trim();
  if (!value) {
    return null;
  }

  if (value.startsWith("https://t.me/") || value.startsWith("http://t.me/")) {
    return value;
  }

  return `https://t.me/${value.replace(/^@+/, "")}`;
}

export function routeHref(club: Pick<Club, "latitude" | "longitude" | "lat" | "lng" | "name">, label: string) {
  const lat = resolveClubLatitude(club);
  const lng = resolveClubLongitude(club);

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return null;
  }

  const query = encodeURIComponent(`${lat},${lng} ${label}`);
  return `https://www.google.com/maps/search/?api=1&query=${query}`;
}

export function isOpenNow(workingHours: string | null | undefined, now = new Date()) {
  const match = (workingHours ?? "").match(/(\d{1,2}):(\d{2})\s*[-–]\s*(\d{1,2}):(\d{2})/);
  if (!match) {
    return null;
  }

  const open = Number(match[1]) * 60 + Number(match[2]);
  const close = Number(match[3]) * 60 + Number(match[4]);
  const current = now.getHours() * 60 + now.getMinutes();

  if (close <= open) {
    return current >= open || current <= close;
  }

  return current >= open && current <= close;
}

export function formatPrice(value: number | null | undefined) {
  if (typeof value !== "number") {
    return "-";
  }

  return `${new Intl.NumberFormat("ru-RU").format(value)} UZS`;
}
