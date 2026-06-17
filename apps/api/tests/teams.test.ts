import * as assert from "node:assert/strict";
import { isTeamComplete, isTeamFormat, requiredTeamSize } from "../src/teams/teams.util";

function testRequiredTeamSize() {
  assert.equal(requiredTeamSize("TEAM_2X2"), 2);
  assert.equal(requiredTeamSize("TEAM_3X3"), 3);
  assert.equal(requiredTeamSize("TEAM"), 2);
  assert.equal(requiredTeamSize("INDIVIDUAL"), 1);
}

function testIsTeamFormat() {
  assert.equal(isTeamFormat("TEAM"), true);
  assert.equal(isTeamFormat("TEAM_2X2"), true);
  assert.equal(isTeamFormat("TEAM_3X3"), true);
  assert.equal(isTeamFormat("INDIVIDUAL"), false);
}

function testIsTeamComplete() {
  assert.equal(isTeamComplete("TEAM_2X2", 2), true);
  assert.equal(isTeamComplete("TEAM_2X2", 1), false);
  assert.equal(isTeamComplete("TEAM_3X3", 3), true);
  assert.equal(isTeamComplete("TEAM_3X3", 2), false);
}

function main() {
  testRequiredTeamSize();
  testIsTeamFormat();
  testIsTeamComplete();
  console.log("Teams tests passed.");
}

main();
