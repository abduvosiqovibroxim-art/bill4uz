import { TournamentFormat } from "@prisma/client";

export interface CreateTeamDto {
  name: string;
  eventFormat: TournamentFormat;
}

export interface InviteTeamMemberDto {
  playerId: string;
}

export interface RespondInviteDto {
  accept: boolean;
}

export interface SubstituteMemberDto {
  outPlayerId: string;
  inPlayerId: string;
}
