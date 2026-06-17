export interface ClubTableBlueprint {
  name: string;
  kind: "REGULAR" | "VIP";
  sortOrder: number;
}

export function clampVipTableCount(tableCount: number, vipTableCount: number) {
  return Math.max(0, Math.min(vipTableCount, tableCount));
}

export function defaultClubTableKind(sortOrder: number, tableCount: number, vipTableCount: number) {
  const safeVipTableCount = clampVipTableCount(tableCount, vipTableCount);
  return sortOrder > tableCount - safeVipTableCount ? "VIP" : "REGULAR";
}

export function defaultClubTableName(sortOrder: number, tableCount: number, vipTableCount: number) {
  return defaultClubTableKind(sortOrder, tableCount, vipTableCount) === "VIP" ? `Table ${sortOrder} VIP` : `Table ${sortOrder}`;
}

export function buildClubTableBlueprints(tableCount: number, vipTableCount: number): ClubTableBlueprint[] {
  const safeTableCount = Math.max(0, tableCount);
  const safeVipTableCount = clampVipTableCount(safeTableCount, vipTableCount);

  return Array.from({ length: safeTableCount }, (_, index) => {
    const sortOrder = index + 1;
    return {
      sortOrder,
      kind: defaultClubTableKind(sortOrder, safeTableCount, safeVipTableCount),
      name: defaultClubTableName(sortOrder, safeTableCount, safeVipTableCount)
    };
  });
}

export function createClubTables(clubId: string, tableCount: number, vipTableCount: number) {
  return buildClubTableBlueprints(tableCount, vipTableCount).map((table) => ({
    clubId,
    name: table.name,
    kind: table.kind,
    sortOrder: table.sortOrder
  }));
}
