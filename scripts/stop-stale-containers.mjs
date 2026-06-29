// Guard that runs automatically before `npm run dev` (as the `predev` script).
//
// Problem it fixes: the api/web/bot Docker containers used to carry
// `restart: unless-stopped`, so Docker Desktop auto-revived them on launch.
// They bind [::]:3000/4000/4100 (IPv6) while local `next/nest dev` binds
// 0.0.0.0 (IPv4 only). Windows resolves `localhost` -> ::1 first, so the
// browser hit the STALE Docker build while curl/headless hit fresh local dev
// — the classic "my change reverted" ghost.
//
// This script disables their auto-revive and stops them, so local dev owns the
// ports. It is intentionally best-effort: if Docker isn't running or a
// container doesn't exist, it stays silent and never fails the dev startup.

import { execFileSync } from "node:child_process";

const APP_CONTAINERS = ["billiard_api", "billiard_web", "billiard_bot"];

function dockerAvailable() {
  try {
    execFileSync("docker", ["info"], { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

function quiet(args) {
  try {
    execFileSync("docker", args, { stdio: "ignore" });
  } catch {
    // container absent / already stopped — nothing to do.
  }
}

if (!dockerAvailable()) {
  // Docker engine is off; local dev will start Postgres via `dev:db` and fail
  // loudly there if needed. Nothing for us to clean up.
  process.exit(0);
}

let stopped = 0;
for (const name of APP_CONTAINERS) {
  // Only act on containers that actually exist and are running.
  let running = "";
  try {
    running = execFileSync("docker", ["ps", "-q", "-f", `name=^${name}$`], {
      encoding: "utf8"
    }).trim();
  } catch {
    running = "";
  }
  // Always clear the auto-revive flag (cheap, harmless if absent)...
  quiet(["update", "--restart=no", name]);
  // ...and stop it if it's currently shadowing the port.
  if (running) {
    quiet(["stop", name]);
    stopped += 1;
  }
}

if (stopped > 0) {
  console.log(
    `[predev] Stopped ${stopped} stale Docker app container(s) so local dev owns ports 3000/4000/4100.`
  );
}
