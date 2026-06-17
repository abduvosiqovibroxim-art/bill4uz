const requiredProductionKeys = [
  "DATABASE_URL",
  "BOT_INTERNAL_SECRET",
  "JWT_ACCESS_SECRET",
  "JWT_REFRESH_SECRET",
  "APP_URL",
  "API_PUBLIC_URL",
  "CORS_ORIGIN",
  "EMAIL_DELIVERY_MODE",
  "EMAIL_FROM",
  "SMTP_HOST",
  "SMTP_PORT",
  "SMTP_USER",
  "SMTP_PASS"
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

function requireHttpsUrl(key: string) {
  const value = requireValue(key);
  if (!value.startsWith("https://")) {
    throw new Error(`Production env ${key} must use https://`);
  }
}

export function validateProductionEnv() {
  if (process.env.REQUIRE_PRODUCTION_CONFIG !== "true") {
    return;
  }

  for (const key of requiredProductionKeys) {
    requireValue(key);
  }

  requireHttpsUrl("APP_URL");
  requireHttpsUrl("API_PUBLIC_URL");

  const corsOrigins = requireValue("CORS_ORIGIN").split(",").map((origin) => origin.trim());
  if (corsOrigins.some((origin) => !origin.startsWith("https://"))) {
    throw new Error("Production env CORS_ORIGIN must contain only https:// origins");
  }

  if (process.env.AUTH_COOKIE_SECURE !== "true") {
    throw new Error("Production env AUTH_COOKIE_SECURE must be true");
  }

  if (process.env.EMAIL_DELIVERY_MODE !== "smtp") {
    throw new Error("Production env EMAIL_DELIVERY_MODE must be smtp");
  }

  if (requireValue("JWT_ACCESS_SECRET").length < 32 || requireValue("JWT_REFRESH_SECRET").length < 32) {
    throw new Error("Production JWT secrets must be at least 32 characters");
  }

  if (requireValue("BOT_INTERNAL_SECRET").length < 32) {
    throw new Error("Production BOT_INTERNAL_SECRET must be at least 32 characters");
  }
}
