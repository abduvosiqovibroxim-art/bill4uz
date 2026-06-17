const requiredProductionKeys = [
  "TELEGRAM_BOT_TOKEN",
  "TELEGRAM_BOT_USERNAME",
  "BOT_API_URL",
  "BOT_INTERNAL_SECRET"
];

const weakValuePatterns = [
  /change_me/i,
  /docker_local/i,
  /dev-/i,
  /localhost/i,
  /127\.0\.0\.1/i,
  /example\.com/i,
  /your_/i
];

function requireValue(key: string) {
  const value = process.env[key]?.trim();
  if (!value) {
    throw new Error(`Production env ${key} is required`);
  }

  if (weakValuePatterns.some((pattern) => pattern.test(value))) {
    throw new Error(`Production env ${key} contains a development or placeholder value`);
  }

  return value;
}

export function validateProductionEnv() {
  if (process.env.REQUIRE_PRODUCTION_CONFIG !== "true") {
    return;
  }

  for (const key of requiredProductionKeys) {
    requireValue(key);
  }

  if (!requireValue("BOT_API_URL").startsWith("https://")) {
    throw new Error("Production env BOT_API_URL must use https://");
  }

  if (requireValue("BOT_INTERNAL_SECRET").length < 32) {
    throw new Error("Production BOT_INTERNAL_SECRET must be at least 32 characters");
  }

  const mode = (process.env.BOT_MODE ?? "polling").toLowerCase();
  if (mode === "webhook") {
    const webhookUrl = requireValue("BOT_WEBHOOK_URL");
    if (!webhookUrl.startsWith("https://")) {
      throw new Error("Production env BOT_WEBHOOK_URL must use https://");
    }
  }
}
