import { DisputeStatus } from "@prisma/client";

export interface FileDisputeDto {
  reason: string;
}

export interface ResolveDisputeDto {
  status: DisputeStatus; // UPHELD | REJECTED
  resolution?: string;
}
