import { createHash, timingSafeEqual } from "crypto";

function digest(value: string) {
  return createHash("sha256").update(value).digest();
}

export function hashToken(value: string): string {
  return digest(value).toString("hex");
}

export function verifyTokenHash(value: string, hashedValue: string): boolean {
  const actual = digest(value);
  const expected = Buffer.from(hashedValue, "hex");

  if (actual.length !== expected.length) {
    return false;
  }

  return timingSafeEqual(actual, expected);
}
