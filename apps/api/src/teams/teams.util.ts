import { TournamentFormat } from "@prisma/client";

/** Number of active players a team must field for a given event format. */
export function requiredTeamSize(format: TournamentFormat): number {
  switch (format) {
    case "TEAM_3X3":
      return 3;
    case "TEAM_2X2":
      return 2;
    case "TEAM":
      return 2;
    default:
      return 1;
  }
}

export function isTeamFormat(format: TournamentFormat): boolean {
  return format === "TEAM" || format === "TEAM_2X2" || format === "TEAM_3X3";
}

/** A team is tournament-ready when it has exactly the required number of active members. */
export function isTeamComplete(format: TournamentFormat, activeMemberCount: number): boolean {
  return activeMemberCount === requiredTeamSize(format);
}
