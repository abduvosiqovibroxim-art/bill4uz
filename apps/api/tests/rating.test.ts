import * as assert from "node:assert/strict";
import {
  bumpWinStreak,
  computeElo,
  computeMmr,
  expectedScore,
  resetWinStreak,
  teamAverage,
  winPercentage
} from "../src/rating/rating.util";

function testExpectedScore() {
  assert.equal(expectedScore(1000, 1000), 0.5);
  assert.ok(expectedScore(1200, 1000) > 0.5);
  assert.ok(expectedScore(1000, 1200) < 0.5);
}

function testEqualEloMatch() {
  // New players (K=40), equal rating -> ±20.
  const change = computeElo(1000, 1000, 0);
  assert.equal(change.winner, 1020);
  assert.equal(change.loser, 980);
  assert.equal(change.winnerDelta, 20);
  assert.equal(change.loserDelta, -20);
}

function testEstablishedFavouriteWins() {
  // Established players (K=24): favourite beating underdog gains little.
  const change = computeElo(1200, 1000, 30);
  assert.equal(change.winner, 1206);
  assert.equal(change.loser, 994);
}

function testUnderdogWinsGainsMore() {
  const change = computeElo(1000, 1200, 30);
  assert.ok(change.winnerDelta > 12, "underdog should gain more than a flat half-K");
  assert.equal(change.winner - 1000, change.winnerDelta);
}

function testMmrUsesFlatK() {
  const change = computeMmr(1000, 1000);
  assert.equal(change.winner, 1016);
  assert.equal(change.loser, 984);
}

function testRatingFloor() {
  const change = computeElo(120, 1000, 30);
  assert.ok(change.loser >= 100, "rating must not drop below the floor");
}

function testStreaks() {
  assert.deepEqual(bumpWinStreak({ current: 2, best: 3 }), { current: 3, best: 3 });
  assert.deepEqual(bumpWinStreak({ current: 3, best: 3 }), { current: 4, best: 4 });
  assert.deepEqual(resetWinStreak({ current: 5, best: 7 }), { current: 0, best: 7 });
}

function testWinPercentage() {
  assert.equal(winPercentage(3, 1), 75);
  assert.equal(winPercentage(7, 0), 100);
  assert.equal(winPercentage(0, 0), 0);
}

function testTeamAverage() {
  assert.equal(teamAverage([1000, 1200]), 1100);
  assert.equal(teamAverage([1000, 1000, 1300]), 1100);
  assert.equal(teamAverage([]), 1000);
  assert.equal(teamAverage([], 0), 0);
}

function main() {
  testTeamAverage();
  testExpectedScore();
  testEqualEloMatch();
  testEstablishedFavouriteWins();
  testUnderdogWinsGainsMore();
  testMmrUsesFlatK();
  testRatingFloor();
  testStreaks();
  testWinPercentage();
  console.log("Rating tests passed.");
}

main();
