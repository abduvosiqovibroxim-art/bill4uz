import type { LocalizedTextDto } from "../tournaments/dto";

export interface MediaComputedFields {
  typeKey: string;
  // TODO(next migration): persist media description in DB.
  description: string | LocalizedTextDto | null;
}
