import * as assert from "node:assert/strict";
import { buildClubTableBlueprints, createClubTables } from "../src/clubs/table-inventory";

const blueprints = buildClubTableBlueprints(10, 2);

assert.equal(blueprints.length, 10);
assert.deepEqual(
  blueprints.map((table) => ({ sortOrder: table.sortOrder, kind: table.kind })),
  [
    { sortOrder: 1, kind: "REGULAR" },
    { sortOrder: 2, kind: "REGULAR" },
    { sortOrder: 3, kind: "REGULAR" },
    { sortOrder: 4, kind: "REGULAR" },
    { sortOrder: 5, kind: "REGULAR" },
    { sortOrder: 6, kind: "REGULAR" },
    { sortOrder: 7, kind: "REGULAR" },
    { sortOrder: 8, kind: "REGULAR" },
    { sortOrder: 9, kind: "VIP" },
    { sortOrder: 10, kind: "VIP" }
  ]
);
assert.equal(blueprints[0]?.name, "Table 1");
assert.equal(blueprints[8]?.name, "Table 9 VIP");

const rows = createClubTables("club-1", 10, 2);
assert.equal(rows.length, 10);
assert.equal(rows[7]?.kind, "REGULAR");
assert.equal(rows[8]?.kind, "VIP");
assert.equal(rows[9]?.sortOrder, 10);
