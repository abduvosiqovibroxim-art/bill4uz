export interface BotSessionData {
  language?: "ru" | "uz";
  registration?:
    | {
        step: "name" | "city" | "phone";
        fullName?: string;
        city?: string;
        phone?: string;
      }
    | undefined;
  matchInvite?:
    | {
        step: "username";
      }
    | undefined;
  existingPhone?: string | undefined;
}
