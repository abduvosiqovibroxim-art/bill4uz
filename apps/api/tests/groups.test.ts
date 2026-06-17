import * as assert from "node:assert/strict";
import {
  assignGroups,
  nextPlayoffSize,
  selectPlayoffSeedOrder
} from "../src/brackets/bracket.utils";

function testAssignGroups() {
  const eight = assignGroups(["1", "2", "3", "4", "5", "6", "7", "8"], 4);
  assert.equal(eight.length, 2);
  assert.equal(eight.every((group) => group.length === 4), true);
  // Balanced round-robin distribution.
  assert.deepEqual(eight[0], ["1", "3", "5", "7"]);
  assert.deepEqual(eight[1], ["2", "4", "6", "8"]);

  const six = assignGroups(["1", "2", "3", "4", "5", "6"], 4);
  assert.equal(six.length, 2);
  assert.equal(six[0].length, 3);
  assert.equal(six[1].length, 3);
}

function testPlayoffSeedOrder() {
  const order = selectPlayoffSeedOrder(
    [
      ["a1", "a2"],
      ["b1", "b2"]
    ],
    2
  );
  // Winners first (group order), then runners-up — cross-group seeding.
  assert.deepEqual(order, ["a1", "b1", "a2", "b2"]);
}

function testNextPlayoffSize() {
  assert.equal(nextPlayoffSize(4), 4);
  assert.equal(nextPlayoffSize(6), 8);
  assert.equal(nextPlayoffSize(8), 8);
  assert.equal(nextPlayoffSize(2), 4); // minimum bracket size
}

function main() {
  testAssignGroups();
  testPlayoffSeedOrder();
  testNextPlayoffSize();
  console.log("Group + playoff tests passed.");
}

main();
