import type { LocalizedTextDto } from "./dto";

export type TournamentBilliardKindKey = "PYRAMID" | "POOL" | "SNOOKER";
export type TournamentDisciplineKey =
  | "freePyramid"
  | "russianPyramid"
  | "combinedPyramid"
  | "dynamicPyramid"
  | "moscowPyramid"
  | "pool8"
  | "pool9"
  | "pool10"
  | "pool141"
  | "snooker"
  | "chineseBilliards";

export const TOURNAMENT_DISCIPLINES: Array<{
  key: TournamentDisciplineKey;
  name: string;
  label: LocalizedTextDto;
  billiardKind: TournamentBilliardKindKey;
  active: boolean;
}> = [
  {
    key: "freePyramid",
    name: "Свободная пирамида",
    label: {
      ru: "Свободная пирамида",
      uz: "Erkin piramida",
      en: "Free pyramid"
    },
    billiardKind: "PYRAMID",
    active: true
  },
  {
    key: "russianPyramid",
    name: "Русская пирамида",
    label: {
      ru: "Русская пирамида",
      uz: "Rus piramidasi",
      en: "Russian pyramid"
    },
    billiardKind: "PYRAMID",
    active: true
  },
  {
    key: "combinedPyramid",
    name: "Комбинированная пирамида",
    label: {
      ru: "Комбинированная пирамида",
      uz: "Kombinatsiyalangan piramida",
      en: "Combined pyramid"
    },
    billiardKind: "PYRAMID",
    active: true
  },
  {
    key: "dynamicPyramid",
    name: "Динамичная пирамида",
    label: {
      ru: "Динамичная пирамида",
      uz: "Dinamik piramida",
      en: "Dynamic pyramid"
    },
    billiardKind: "PYRAMID",
    active: true
  },
  {
    key: "moscowPyramid",
    name: "Московская пирамида",
    label: {
      ru: "Московская пирамида",
      uz: "Moskva piramidasi",
      en: "Moscow pyramid"
    },
    billiardKind: "PYRAMID",
    active: true
  },
  {
    key: "pool8",
    name: "Пул-8",
    label: {
      ru: "Пул-8",
      uz: "Pul-8",
      en: "Pool-8"
    },
    billiardKind: "POOL",
    active: true
  },
  {
    key: "pool9",
    name: "Пул-9",
    label: {
      ru: "Пул-9",
      uz: "Pul-9",
      en: "Pool-9"
    },
    billiardKind: "POOL",
    active: true
  },
  {
    key: "pool10",
    name: "Пул-10",
    label: {
      ru: "Пул-10",
      uz: "Pul-10",
      en: "Pool-10"
    },
    billiardKind: "POOL",
    active: true
  },
  {
    key: "pool141",
    name: "14.1",
    label: {
      ru: "14.1",
      uz: "14.1",
      en: "14.1"
    },
    billiardKind: "POOL",
    active: true
  },
  {
    key: "snooker",
    name: "Снукер",
    label: {
      ru: "Снукер",
      uz: "Snuker",
      en: "Snooker"
    },
    billiardKind: "SNOOKER",
    active: true
  },
  {
    key: "chineseBilliards",
    name: "Китайский бильярд",
    label: {
      ru: "Китайский бильярд",
      uz: "Xitoy bilyardi",
      en: "Chinese billiards"
    },
    billiardKind: "POOL",
    active: true
  }
];

export const TOURNAMENT_DISCIPLINE_NAMES = TOURNAMENT_DISCIPLINES.map((discipline) => discipline.name);
export const ACTIVE_TOURNAMENT_DISCIPLINE_NAMES = TOURNAMENT_DISCIPLINES.filter((discipline) => discipline.active).map(
  (discipline) => discipline.name
);

const aliases = new Map<string, TournamentDisciplineKey>([
  ["freepyramid", "freePyramid"],
  ["svobodnayapiramida", "freePyramid"],
  ["свободнаяпирамида", "freePyramid"],
  ["erkinpiramida", "freePyramid"],
  ["russianpyramid", "russianPyramid"],
  ["ruspyramid", "russianPyramid"],
  ["russkayapiramida", "russianPyramid"],
  ["русскаяпирамида", "russianPyramid"],
  ["ruspiramidasi", "russianPyramid"],
  ["combinedpyramid", "combinedPyramid"],
  ["kombinirovannayapiramida", "combinedPyramid"],
  ["комбинированнаяпирамида", "combinedPyramid"],
  ["dinamikpiramida", "dynamicPyramid"],
  ["dynamicpyramid", "dynamicPyramid"],
  ["динамичнаяпирамида", "dynamicPyramid"],
  ["moscowpyramid", "moscowPyramid"],
  ["московскаяпирамида", "moscowPyramid"],
  ["pool8", "pool8"],
  ["пул8", "pool8"],
  ["8ball", "pool8"],
  ["pool9", "pool9"],
  ["пул9", "pool9"],
  ["9ball", "pool9"],
  ["pool10", "pool10"],
  ["пул10", "pool10"],
  ["10ball", "pool10"],
  ["141", "pool141"],
  ["14.1", "pool141"],
  ["snooker", "snooker"],
  ["снукер", "snooker"],
  ["chinesebilliards", "chineseBilliards"],
  ["chinese", "chineseBilliards"],
  ["chinese8", "chineseBilliards"],
  ["heyball", "chineseBilliards"],
  ["китайскийбильярд", "chineseBilliards"],
  ["xitoybilyardi", "chineseBilliards"]
]);

export function getTournamentDisciplineByInput(
  value?: string | null,
  options: {
    activeOnly?: boolean;
  } = {}
) {
  const normalized = normalizeTournamentDiscipline(value);
  const key = aliases.get(normalized);
  if (!key) {
    return undefined;
  }

  const discipline = TOURNAMENT_DISCIPLINES.find((item) => item.key === key);
  if (!discipline) {
    return undefined;
  }

  if (options.activeOnly && !discipline.active) {
    return undefined;
  }

  return discipline;
}

export function isTournamentDisciplineName(
  value?: string | null,
  options: {
    activeOnly?: boolean;
  } = {}
) {
  return Boolean(getTournamentDisciplineByInput(value, options));
}

export function tournamentDisciplineKeyFromName(value?: string | null): TournamentDisciplineKey {
  return getTournamentDisciplineByInput(value)?.key ?? "freePyramid";
}

export function tournamentDisciplineLabelFromName(value?: string | null): LocalizedTextDto {
  return getTournamentDisciplineByInput(value)?.label ?? TOURNAMENT_DISCIPLINES[0].label;
}

export function tournamentDisciplineNameFromInput(value?: string | null) {
  return getTournamentDisciplineByInput(value)?.name;
}

export function normalizeTournamentDiscipline(value?: string | null) {
  return (value ?? "")
    .toLowerCase()
    .replace(/ё/g, "е")
    .replace(/[^a-zа-я0-9]+/giu, "");
}
