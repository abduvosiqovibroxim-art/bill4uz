import type {
  BilliardKindKey,
  DisciplineKey,
  ParticipantSelectionModeKey,
  PlayerLevelKey,
  TournamentBracketSystemKey,
  TournamentCategoryKey,
  TournamentEventFormatKey,
  TournamentLevelKey,
  TournamentTypeKey
} from "./types";

export type UiLocale = "ru" | "uz" | "en";

type LocalizedLabel = Record<UiLocale, string>;

export interface TaxonomyOption<T extends string> {
  value: T;
  label: LocalizedLabel;
  active: boolean;
}

export const billiardKindOptions: TaxonomyOption<BilliardKindKey>[] = [
  { value: "pyramid", label: { ru: "Пирамида", uz: "Piramida", en: "Pyramid" }, active: true },
  { value: "pool", label: { ru: "Пул", uz: "Pul", en: "Pool" }, active: false },
  { value: "snooker", label: { ru: "Снукер", uz: "Snuker", en: "Snooker" }, active: false }
];

export const tournamentCategoryOptions: TaxonomyOption<TournamentCategoryKey>[] = [
  { value: "men", label: { ru: "Мужчины", uz: "Erkaklar", en: "Men" }, active: true },
  { value: "women", label: { ru: "Женщины", uz: "Ayollar", en: "Women" }, active: true },
  { value: "juniors", label: { ru: "Юниоры", uz: "Yuniorlar", en: "Juniors" }, active: true },
  { value: "girls", label: { ru: "Девушки", uz: "Qizlar", en: "Girls" }, active: true },
  { value: "amateurs", label: { ru: "Любители", uz: "Havaskorlar", en: "Amateurs" }, active: true },
  { value: "professionals", label: { ru: "Профессионалы", uz: "Professionallar", en: "Professionals" }, active: true },
  { value: "open", label: { ru: "Open", uz: "Open", en: "Open" }, active: true },
  { value: "team", label: { ru: "Командный", uz: "Jamoaviy", en: "Team" }, active: true },
  { value: "personal", label: { ru: "Личный", uz: "Shaxsiy", en: "Personal" }, active: true }
];

export const tournamentLevelOptions: TaxonomyOption<TournamentLevelKey>[] = [
  { value: "openTournament", label: { ru: "Открытый турнир", uz: "Ochiq turnir", en: "Open tournament" }, active: true },
  { value: "championship", label: { ru: "Чемпионат", uz: "Chempionat", en: "Championship" }, active: true },
  { value: "cup", label: { ru: "Кубок", uz: "Kubok", en: "Cup" }, active: true },
  { value: "league", label: { ru: "Лига", uz: "Liga", en: "League" }, active: true },
  { value: "ratedTournament", label: { ru: "Рейтинговый турнир", uz: "Reyting turniri", en: "Rated tournament" }, active: true },
  { value: "friendlyTournament", label: { ru: "Товарищеский турнир", uz: "Do'stona turnir", en: "Friendly tournament" }, active: true },
  { value: "clubTournament", label: { ru: "Клубный турнир", uz: "Klub turniri", en: "Club tournament" }, active: true }
];

export const tournamentFormatOptions: TaxonomyOption<TournamentEventFormatKey>[] = [
  { value: "individual", label: { ru: "Личный", uz: "Shaxsiy", en: "Individual" }, active: true },
  { value: "team", label: { ru: "Командный", uz: "Jamoaviy", en: "Team" }, active: false },
  { value: "team2x2", label: { ru: "2x2", uz: "2x2", en: "2x2" }, active: false },
  { value: "team3x3", label: { ru: "3x3", uz: "3x3", en: "3x3" }, active: false }
];

export const bracketSystemOptions: TaxonomyOption<TournamentBracketSystemKey>[] = [
  { value: "singleElimination", label: { ru: "Single Elimination", uz: "Single Elimination", en: "Single Elimination" }, active: true },
  { value: "doubleElimination", label: { ru: "Double Elimination", uz: "Double Elimination", en: "Double Elimination" }, active: true },
  { value: "roundRobin", label: { ru: "Round Robin", uz: "Round Robin", en: "Round Robin" }, active: true },
  { value: "swiss", label: { ru: "Swiss", uz: "Swiss", en: "Swiss" }, active: true },
  { value: "groupPlayoff", label: { ru: "Group + Playoff", uz: "Group + Playoff", en: "Group + Playoff" }, active: true }
];

export const tournamentTypeOptions: TaxonomyOption<TournamentTypeKey>[] = [
  { value: "visitor", label: { ru: "Для посетителей", uz: "Tashrif buyuruvchilar uchun", en: "Visitor" }, active: true },
  { value: "amateur", label: { ru: "Любительский", uz: "Havaskor", en: "Amateur" }, active: true },
  { value: "pro", label: { ru: "Профессиональный", uz: "Professional", en: "Professional" }, active: true }
];

export const participantSelectionModeOptions: TaxonomyOption<ParticipantSelectionModeKey>[] = [
  { value: "direct", label: { ru: "Сразу участвовать", uz: "Darhol ishtirok", en: "Direct join" }, active: true },
  { value: "applications", label: { ru: "Через заявки", uz: "Arizalar orqali", en: "By applications" }, active: true },
  { value: "manualDraw", label: { ru: "Ручная жеребьевка", uz: "Qo'lda qur'a", en: "Manual draw" }, active: true }
];

export const playerLevelOptions: TaxonomyOption<PlayerLevelKey>[] = [
  { value: "novice", label: { ru: "Новичок", uz: "Yangi boshlovchi", en: "Novice" }, active: true },
  { value: "amateur", label: { ru: "Любитель", uz: "Havaskor", en: "Amateur" }, active: true },
  { value: "strongAmateur", label: { ru: "Сильный любитель", uz: "Kuchli havaskor", en: "Strong amateur" }, active: true },
  { value: "semiPro", label: { ru: "Полупрофи", uz: "Yarim professional", en: "Semi-pro" }, active: true },
  { value: "pro", label: { ru: "Профи", uz: "Professional", en: "Pro" }, active: true }
];

const disciplineLabelByKey: Record<DisciplineKey, LocalizedLabel> = {
  freePyramid: { ru: "Свободная пирамида", uz: "Erkin piramida", en: "Free pyramid" },
  russianPyramid: { ru: "Русская пирамида", uz: "Rus piramidasi", en: "Russian pyramid" },
  combinedPyramid: { ru: "Комбинированная пирамида", uz: "Kombinatsiyalangan piramida", en: "Combined pyramid" },
  dynamicPyramid: { ru: "Динамичная пирамида", uz: "Dinamik piramida", en: "Dynamic pyramid" },
  moscowPyramid: { ru: "Московская пирамида", uz: "Moskva piramidasi", en: "Moscow pyramid" },
  pool8: { ru: "Пул-8", uz: "Pul-8", en: "Pool-8" },
  pool9: { ru: "Пул-9", uz: "Pul-9", en: "Pool-9" },
  pool10: { ru: "Пул-10", uz: "Pul-10", en: "Pool-10" },
  pool141: { ru: "14.1", uz: "14.1", en: "14.1" },
  snooker: { ru: "Снукер", uz: "Snuker", en: "Snooker" },
  chineseBilliards: { ru: "Китайский бильярд", uz: "Xitoy bilyardi", en: "Chinese billiards" }
};

const disciplineOptionKeys: DisciplineKey[] = [
  "freePyramid",
  "russianPyramid",
  "combinedPyramid",
  "dynamicPyramid",
  "moscowPyramid",
  "pool8",
  "pool9",
  "pool10",
  "pool141",
  "snooker",
  "chineseBilliards"
];

// All disciplines are selectable. "Soon"/disabled gating applies only to
// unsupported bracket systems (see bracketSystemOptions), not to disciplines.
export const activeDisciplineKeys = new Set<DisciplineKey>(disciplineOptionKeys);

export const disciplineOptions: TaxonomyOption<DisciplineKey>[] = disciplineOptionKeys.map((value) => ({
  value,
  label: disciplineLabelByKey[value],
  active: activeDisciplineKeys.has(value)
}));

const disciplineAliases = new Map<string, DisciplineKey>([
  ["freepyramid", "freePyramid"],
  ["svobodnayapiramida", "freePyramid"],
  ["свободнаяпирамида", "freePyramid"],
  ["erkinpiramida", "freePyramid"],
  ["russianpyramid", "russianPyramid"],
  ["русскаяпирамида", "russianPyramid"],
  ["ruspiramidasi", "russianPyramid"],
  ["combinedpyramid", "combinedPyramid"],
  ["комбинированнаяпирамида", "combinedPyramid"],
  ["dynamicpyramid", "dynamicPyramid"],
  ["динамичнаяпирамида", "dynamicPyramid"],
  ["moscowpyramid", "moscowPyramid"],
  ["московскаяпирамида", "moscowPyramid"],
  ["pool8", "pool8"],
  ["8ball", "pool8"],
  ["пул8", "pool8"],
  ["pool9", "pool9"],
  ["9ball", "pool9"],
  ["пул9", "pool9"],
  ["pool10", "pool10"],
  ["10ball", "pool10"],
  ["пул10", "pool10"],
  ["141", "pool141"],
  ["snooker", "snooker"],
  ["снукер", "snooker"],
  ["chinesebilliards", "chineseBilliards"],
  ["chinese", "chineseBilliards"],
  ["chinese8", "chineseBilliards"],
  ["heyball", "chineseBilliards"],
  ["китайскийбильярд", "chineseBilliards"],
  ["xitoybilyardi", "chineseBilliards"]
]);

export function disciplineKeyFromName(name?: string | null): DisciplineKey | null {
  const normalized = normalizeDiscipline(name);
  return disciplineAliases.get(normalized) ?? null;
}

export function isDisciplineActive(name?: string | null) {
  const key = disciplineKeyFromName(name);
  return Boolean(key && activeDisciplineKeys.has(key));
}

export function disciplineLabelFromName(name: string | null | undefined, locale: UiLocale) {
  const key = disciplineKeyFromName(name);
  if (!key) {
    return name?.trim() || "-";
  }

  return disciplineLabelByKey[key][locale];
}

function normalizeDiscipline(value?: string | null) {
  return (value ?? "")
    .toLowerCase()
    .replace(/ё/g, "е")
    .replace(/[^a-zа-я0-9]+/giu, "");
}
