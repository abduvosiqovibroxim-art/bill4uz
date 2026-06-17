import { BadRequestException } from "@nestjs/common";

export type ClubTableKind = "REGULAR" | "VIP";

export interface BookingPriceSegment {
  startAt: string;
  endAt: string;
  hourlyRateMinor: number;
  minutes: number;
  amountMinor: number;
}

export interface BookingPriceQuote {
  tableKind: ClubTableKind;
  priceMinor: number;
  hourlyRateMinor: number;
  segments: BookingPriceSegment[];
}

export interface ClubPricingConfig {
  regularMorningPriceMinor: number;
  regularEveningPriceMinor: number;
  vipMorningPriceMinor: number;
  vipEveningPriceMinor: number;
}

const regularTableKinds = new Set(["REGULAR", "STANDARD", "NORMAL", "ОБЫЧНЫЙ", "OBYCHNY", "ODDIY"]);

export function normalizeTableKind(value?: string | null): ClubTableKind {
  const normalized = (value ?? "").trim().toUpperCase();
  return normalized === "VIP" ? "VIP" : regularTableKinds.has(normalized) ? "REGULAR" : "REGULAR";
}

export function tableKindLabel(kind: string | null | undefined) {
  return normalizeTableKind(kind) === "VIP" ? "VIP стол" : "Обычный стол";
}

export function resolveClubPricingConfig(input: {
  regularMorningPriceMinor?: number | null;
  regularEveningPriceMinor?: number | null;
  vipMorningPriceMinor?: number | null;
  vipEveningPriceMinor?: number | null;
}): ClubPricingConfig {
  if (
    typeof input.regularMorningPriceMinor !== "number" ||
    typeof input.regularEveningPriceMinor !== "number" ||
    typeof input.vipMorningPriceMinor !== "number" ||
    typeof input.vipEveningPriceMinor !== "number"
  ) {
    throw new BadRequestException("Club pricing is not configured yet.");
  }

  return {
    regularMorningPriceMinor: input.regularMorningPriceMinor,
    regularEveningPriceMinor: input.regularEveningPriceMinor,
    vipMorningPriceMinor: input.vipMorningPriceMinor,
    vipEveningPriceMinor: input.vipEveningPriceMinor
  };
}

export function hourlyRateMinorFor(kind: string | null | undefined, date: Date, pricing: ClubPricingConfig) {
  const tableKind = normalizeTableKind(kind);
  const minuteOfDay = getTashkentMinuteOfDay(date);
  const isMorning = minuteOfDay >= 10 * 60 && minuteOfDay < 18 * 60;
  const isEvening = minuteOfDay >= 18 * 60 || minuteOfDay < 2 * 60;

  if (isMorning) {
    return tableKind === "VIP" ? pricing.vipMorningPriceMinor : pricing.regularMorningPriceMinor;
  }

  if (isEvening) {
    return tableKind === "VIP" ? pricing.vipEveningPriceMinor : pricing.regularEveningPriceMinor;
  }

  throw new BadRequestException("Selected time is outside booking pricing hours.");
}

export function calculateBookingPrice(
  kind: string | null | undefined,
  startAt: Date,
  endAt: Date,
  pricing: ClubPricingConfig
): BookingPriceQuote {
  if (!Number.isFinite(startAt.getTime()) || !Number.isFinite(endAt.getTime()) || endAt.getTime() <= startAt.getTime()) {
    throw new BadRequestException("Invalid booking time.");
  }

  const tableKind = normalizeTableKind(kind);
  const segments: BookingPriceSegment[] = [];
  let cursor = startAt;

  while (cursor.getTime() < endAt.getTime()) {
    const hourlyRateMinor = hourlyRateMinorFor(tableKind, cursor, pricing);
    const segmentEnd = new Date(Math.min(endAt.getTime(), nextPricingBoundary(cursor).getTime()));
    const minutes = Math.round((segmentEnd.getTime() - cursor.getTime()) / 60_000);
    const amountMinor = Math.round((hourlyRateMinor * minutes) / 60);

    segments.push({
      startAt: cursor.toISOString(),
      endAt: segmentEnd.toISOString(),
      hourlyRateMinor,
      minutes,
      amountMinor
    });

    cursor = segmentEnd;
  }

  return {
    tableKind,
    priceMinor: segments.reduce((sum, segment) => sum + segment.amountMinor, 0),
    hourlyRateMinor: hourlyRateMinorFor(tableKind, startAt, pricing),
    segments
  };
}

function nextPricingBoundary(date: Date) {
  const minuteOfDay = getTashkentMinuteOfDay(date);
  const dateKey = getTashkentDateKey(date);
  const nextBoundaryMinutes =
    minuteOfDay < 2 * 60
      ? 2 * 60
      : minuteOfDay < 10 * 60
        ? 10 * 60
        : minuteOfDay < 18 * 60
          ? 18 * 60
          : 24 * 60 + 2 * 60;

  return buildTashkentDate(dateKey, nextBoundaryMinutes);
}

function buildTashkentDate(date: string, totalMinutes: number) {
  const dayOffset = Math.floor(totalMinutes / (24 * 60));
  const minutesInDay = totalMinutes % (24 * 60);
  const hours = String(Math.floor(minutesInDay / 60)).padStart(2, "0");
  const minutes = String(minutesInDay % 60).padStart(2, "0");
  const base = new Date(`${date}T${hours}:${minutes}:00+05:00`);
  return new Date(base.getTime() + dayOffset * 24 * 60 * 60 * 1000);
}

function getTashkentDateKey(date: Date) {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Tashkent",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  });
  const parts = formatter.formatToParts(date);
  const year = parts.find((part) => part.type === "year")?.value ?? "1970";
  const month = parts.find((part) => part.type === "month")?.value ?? "01";
  const day = parts.find((part) => part.type === "day")?.value ?? "01";
  return `${year}-${month}-${day}`;
}

function getTashkentMinuteOfDay(date: Date) {
  const formatter = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Tashkent",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  });
  const parts = formatter.formatToParts(date);
  const hour = Number(parts.find((part) => part.type === "hour")?.value ?? "0");
  const minute = Number(parts.find((part) => part.type === "minute")?.value ?? "0");
  return hour * 60 + minute;
}
