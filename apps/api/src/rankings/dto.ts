export interface RankingPlayerComputedFields {
  cityKey: string;
  countryKey: string;
  // TODO(next migration): persist player bio in DB-backed profile fields.
  bio: string | null;
}

export interface RankingComputedFields {
  disciplineKey: string;
  cityKey: string;
}
