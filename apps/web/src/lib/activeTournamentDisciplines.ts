import type { DisciplineKey, DisciplineOption } from "./types";
import {
  activeDisciplineKeys,
  disciplineKeyFromName,
  disciplineOptions,
  type UiLocale
} from "./tournamentTaxonomy";

const soonLabelByLocale: Record<UiLocale, string> = {
  ru: "скоро",
  uz: "tez orada",
  en: "soon"
};

export interface TournamentDisciplineSelectOption {
  key: DisciplineKey;
  id: string;
  label: string;
  active: boolean;
  disabled: boolean;
}

export function isSupportedTournamentDisciplineName(name?: string | null) {
  const key = disciplineKeyFromName(name);
  return Boolean(key && activeDisciplineKeys.has(key));
}

export function getTournamentDisciplineSelectOptions(
  disciplines: DisciplineOption[],
  locale: UiLocale
): TournamentDisciplineSelectOption[] {
  const disciplineByKey = new Map<DisciplineKey, DisciplineOption>();

  for (const discipline of disciplines) {
    const key = disciplineKeyFromName(discipline.name);

    if (key) {
      disciplineByKey.set(key, discipline);
    }
  }

  return disciplineOptions.map((option) => {
    const discipline = disciplineByKey.get(option.value);
    const active = option.active && activeDisciplineKeys.has(option.value);
    const baseLabel = discipline?.name ?? option.label[locale];

    return {
      key: option.value,
      id: discipline?.id ?? "",
      label: active ? baseLabel : `${baseLabel} — ${soonLabelByLocale[locale]}`,
      active,
      disabled: !active || !discipline
    };
  });
}
