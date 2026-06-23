import {
  BilliardKind,
  ParticipantSelectionMode,
  PlayerLevel,
  TournamentBracketSystem,
  TournamentCategory,
  TournamentFormat,
  TournamentLevel,
  TournamentType
} from "@prisma/client";
import type { LocalizedTextDto } from "./dto";

type Option<T extends string> = {
  key: T;
  label: LocalizedTextDto;
  active: boolean;
};

export const BILLIARD_KIND_OPTIONS: Option<BilliardKind>[] = [
  {
    key: BilliardKind.PYRAMID,
    label: { ru: "Пирамида", uz: "Piramida", en: "Pyramid" },
    active: true
  },
  {
    key: BilliardKind.POOL,
    label: { ru: "Пул", uz: "Pul", en: "Pool" },
    active: false
  },
  {
    key: BilliardKind.SNOOKER,
    label: { ru: "Снукер", uz: "Snuker", en: "Snooker" },
    active: false
  }
];

export const TOURNAMENT_CATEGORY_OPTIONS: Option<TournamentCategory>[] = [
  { key: TournamentCategory.MEN, label: { ru: "Мужчины", uz: "Erkaklar", en: "Men" }, active: true },
  { key: TournamentCategory.WOMEN, label: { ru: "Женщины", uz: "Ayollar", en: "Women" }, active: true },
  { key: TournamentCategory.JUNIORS, label: { ru: "Юниоры", uz: "Yuniorlar", en: "Juniors" }, active: true },
  { key: TournamentCategory.GIRLS, label: { ru: "Девушки", uz: "Qizlar", en: "Girls" }, active: true },
  { key: TournamentCategory.AMATEURS, label: { ru: "Любители", uz: "Havaskorlar", en: "Amateurs" }, active: true },
  {
    key: TournamentCategory.PROFESSIONALS,
    label: { ru: "Профессионалы", uz: "Professionallar", en: "Professionals" },
    active: true
  },
  { key: TournamentCategory.OPEN, label: { ru: "Open", uz: "Open", en: "Open" }, active: true },
  { key: TournamentCategory.TEAM, label: { ru: "Командный", uz: "Jamoaviy", en: "Team" }, active: true },
  { key: TournamentCategory.PERSONAL, label: { ru: "Личный", uz: "Shaxsiy", en: "Personal" }, active: true }
];

export const TOURNAMENT_LEVEL_OPTIONS: Option<TournamentLevel>[] = [
  {
    key: TournamentLevel.OPEN_TOURNAMENT,
    label: { ru: "Открытый турнир", uz: "Ochiq turnir", en: "Open tournament" },
    active: true
  },
  {
    key: TournamentLevel.CHAMPIONSHIP,
    label: { ru: "Чемпионат", uz: "Chempionat", en: "Championship" },
    active: true
  },
  { key: TournamentLevel.CUP, label: { ru: "Кубок", uz: "Kubok", en: "Cup" }, active: true },
  { key: TournamentLevel.LEAGUE, label: { ru: "Лига", uz: "Liga", en: "League" }, active: true },
  {
    key: TournamentLevel.RATED_TOURNAMENT,
    label: { ru: "Рейтинговый турнир", uz: "Reyting turniri", en: "Rated tournament" },
    active: true
  },
  {
    key: TournamentLevel.FRIENDLY_TOURNAMENT,
    label: { ru: "Товарищеский турнир", uz: "Do'stona turnir", en: "Friendly tournament" },
    active: true
  },
  {
    key: TournamentLevel.CLUB_TOURNAMENT,
    label: { ru: "Клубный турнир", uz: "Klub turniri", en: "Club tournament" },
    active: true
  }
];

export const TOURNAMENT_FORMAT_OPTIONS: Option<TournamentFormat>[] = [
  {
    key: TournamentFormat.INDIVIDUAL,
    label: { ru: "Личный", uz: "Shaxsiy", en: "Individual" },
    active: true
  },
  {
    key: TournamentFormat.TEAM,
    label: { ru: "Командный", uz: "Jamoaviy", en: "Team" },
    active: false
  },
  {
    key: TournamentFormat.TEAM_2X2,
    label: { ru: "2x2", uz: "2x2", en: "2x2" },
    active: false
  },
  {
    key: TournamentFormat.TEAM_3X3,
    label: { ru: "3x3", uz: "3x3", en: "3x3" },
    active: false
  }
];

export const TOURNAMENT_BRACKET_SYSTEM_OPTIONS: Option<TournamentBracketSystem>[] = [
  {
    key: TournamentBracketSystem.SINGLE_ELIMINATION,
    label: { ru: "Single Elimination", uz: "Single Elimination", en: "Single Elimination" },
    active: true
  },
  {
    key: TournamentBracketSystem.DOUBLE_ELIMINATION,
    label: { ru: "Double Elimination", uz: "Double Elimination", en: "Double Elimination" },
    active: true
  },
  {
    key: TournamentBracketSystem.ROUND_ROBIN,
    label: { ru: "Round Robin", uz: "Round Robin", en: "Round Robin" },
    active: true
  },
  {
    key: TournamentBracketSystem.SWISS,
    label: { ru: "Swiss", uz: "Swiss", en: "Swiss" },
    active: true
  },
  {
    key: TournamentBracketSystem.GROUP_PLAYOFF,
    label: { ru: "Group + Playoff", uz: "Group + Playoff", en: "Group + Playoff" },
    active: true
  }
];

export const PARTICIPANT_SELECTION_MODE_OPTIONS: Option<ParticipantSelectionMode>[] = [
  {
    key: ParticipantSelectionMode.APPLICATIONS,
    label: { ru: "По заявкам", uz: "Arizalar orqali", en: "By applications" },
    active: true
  },
  {
    key: ParticipantSelectionMode.DIRECT,
    label: { ru: "Прямое участие", uz: "Darhol ishtirok", en: "Direct join" },
    active: true
  },
  {
    key: ParticipantSelectionMode.MANUAL_DRAW,
    label: { ru: "Ручная жеребьёвка", uz: "Qo'lda qur'a", en: "Manual draw" },
    active: true
  }
];

export const TOURNAMENT_TYPE_OPTIONS: Option<TournamentType>[] = [
  {
    key: TournamentType.VISITOR,
    label: { ru: "Для посетителей", uz: "Tashrif buyuruvchilar uchun", en: "Visitor" },
    active: true
  },
  {
    key: TournamentType.AMATEUR,
    label: { ru: "Любительский", uz: "Havaskor", en: "Amateur" },
    active: true
  },
  {
    key: TournamentType.PRO,
    label: { ru: "Профессиональный", uz: "Professional", en: "Professional" },
    active: true
  }
];

export const PLAYER_LEVEL_OPTIONS: Option<PlayerLevel>[] = [
  { key: PlayerLevel.NOVICE, label: { ru: "Новичок", uz: "Yangi boshlovchi", en: "Novice" }, active: true },
  { key: PlayerLevel.AMATEUR, label: { ru: "Любитель", uz: "Havaskor", en: "Amateur" }, active: true },
  {
    key: PlayerLevel.STRONG_AMATEUR,
    label: { ru: "Сильный любитель", uz: "Kuchli havaskor", en: "Strong amateur" },
    active: true
  },
  { key: PlayerLevel.SEMI_PRO, label: { ru: "Полупро", uz: "Yarim professional", en: "Semi-pro" }, active: true },
  { key: PlayerLevel.PRO, label: { ru: "Профи", uz: "Professional", en: "Pro" }, active: true }
];

export function isActiveBracketSystem(value: TournamentBracketSystem) {
  return Boolean(TOURNAMENT_BRACKET_SYSTEM_OPTIONS.find((item) => item.key === value)?.active);
}

export function isActiveTournamentFormat(value: TournamentFormat) {
  return Boolean(TOURNAMENT_FORMAT_OPTIONS.find((item) => item.key === value)?.active);
}

export function labelForBilliardKind(value: BilliardKind) {
  return findLabel(BILLIARD_KIND_OPTIONS, value, "Пирамида", "Piramida", "Pyramid");
}

export function labelForTournamentCategory(value: TournamentCategory) {
  return findLabel(TOURNAMENT_CATEGORY_OPTIONS, value, "Open", "Open", "Open");
}

export function labelForTournamentLevel(value: TournamentLevel) {
  return findLabel(TOURNAMENT_LEVEL_OPTIONS, value, "Открытый турнир", "Ochiq turnir", "Open tournament");
}

export function labelForTournamentFormat(value: TournamentFormat) {
  return findLabel(TOURNAMENT_FORMAT_OPTIONS, value, "Личный", "Shaxsiy", "Individual");
}

export function labelForBracketSystem(value: TournamentBracketSystem) {
  return findLabel(TOURNAMENT_BRACKET_SYSTEM_OPTIONS, value, "Single Elimination", "Single Elimination", "Single Elimination");
}

export function labelForParticipantSelectionMode(value: ParticipantSelectionMode) {
  return findLabel(PARTICIPANT_SELECTION_MODE_OPTIONS, value, "По заявкам", "Arizalar orqali", "By applications");
}

export function labelForTournamentType(value: TournamentType) {
  return findLabel(TOURNAMENT_TYPE_OPTIONS, value, "Для посетителей", "Tashrif buyuruvchilar uchun", "Visitor");
}

export function labelForPlayerLevel(value: PlayerLevel) {
  return findLabel(PLAYER_LEVEL_OPTIONS, value, "Новичок", "Yangi boshlovchi", "Novice");
}

function findLabel<T extends string>(
  options: Option<T>[],
  key: T,
  fallbackRu: string,
  fallbackUz: string,
  fallbackEn: string
) {
  return options.find((item) => item.key === key)?.label ?? { ru: fallbackRu, uz: fallbackUz, en: fallbackEn };
}
