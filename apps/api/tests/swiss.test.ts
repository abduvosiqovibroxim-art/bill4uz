import * as assert from "node:assert/strict";
import {
  pairSwissRound,
  swissPairKey,
  swissRoundOnePairings,
  swissRoundTarget,
  type SwissStanding
} from "../src/brackets/bracket.utils";

function testRoundTarget() {
  assert.equal(swissRoundTarget(4), 2);
  assert.equal(swissRoundTarget(8), 3);
  assert.equal(swissRoundTarget(16), 4);
  assert.equal(swissRoundTarget(5), 3);
  assert.equal(swissRoundTarget(2), 1);
}

function testRoundOneSplit() {
  const pairings = swissRoundOnePairings(["1", "2", "3", "4"]);
  // Even field -> top half vs bottom half: 1v3, 2v4.
  assert.equal(pairings.length, 2);
  assert.deepEqual(pairings[0], { home: "1", away: "3" });
  assert.deepEqual(pairings[1], { home: "2", away: "4" });
  assert.equal(pairings.every((pair) => pair.away !== null), true);
}

function testAvoidsRematch() {
  // After round 1 (1v3, 2v4) winners 1 & 2 (score 1), losers 3 & 4 (score 0).
  const standings: SwissStanding[] = [
    { participantId: "1", seed: 1, score: 1 },
    { participantId: "2", seed: 2, score: 1 },
    { participantId: "3", seed: 3, score: 0 },
    { participantId: "4", seed: 4, score: 0 }
  ];
  const played = new Set([swissPairKey("1", "3"), swissPairKey("2", "4")]);
  const pairings = pairSwissRound(standings, played, new Set());

  assert.equal(pairings.length, 2);
  // Top scorers meet: 1 vs 2; bottom: 3 vs 4. No rematch of round 1.
  assert.deepEqual(pairings[0], { home: "1", away: "2" });
  assert.deepEqual(pairings[1], { home: "3", away: "4" });
  for (const pair of pairings) {
    assert.equal(played.has(swissPairKey(pair.home, pair.away!)), false);
  }
}

function testOddFieldGetsBye() {
  const standings: SwissStanding[] = [
    { participantId: "a", seed: 1, score: 0 },
    { participantId: "b", seed: 2, score: 0 },
    { participantId: "c", seed: 3, score: 0 }
  ];
  const pairings = pairSwissRound(standings, new Set(), new Set());
  const bye = pairings.find((pair) => pair.away === null);
  assert.ok(bye, "odd field must produce a bye");
  assert.equal(bye!.home, "c"); // lowest-ranked gets the bye
  assert.equal(pairings.filter((pair) => pair.away !== null).length, 1);
}

function main() {
  testRoundTarget();
  testRoundOneSplit();
  testAvoidsRematch();
  testOddFieldGetsBye();
  console.log("Swiss tests passed.");
}

main();
