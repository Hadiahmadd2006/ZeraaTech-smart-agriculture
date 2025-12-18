import crypto from "crypto";

const PBKDF2_ITERATIONS = 120000;
const KEYLEN = 32;
const DIGEST = "sha256";

export function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto
    .pbkdf2Sync(password, salt, PBKDF2_ITERATIONS, KEYLEN, DIGEST)
    .toString("hex");
  return `pbkdf2$${DIGEST}$${PBKDF2_ITERATIONS}$${salt}$${hash}`;
}

export function verifyPassword(password, stored) {
  if (!stored || typeof stored !== "string") return false;

  const parts = stored.split("$");
  if (parts.length !== 5) return false;

  const [, digest, iterationsRaw, salt, expectedHex] = parts;
  const iterations = Number(iterationsRaw);
  if (!digest || !salt || !expectedHex || !Number.isFinite(iterations)) return false;

  const actualHex = crypto.pbkdf2Sync(password, salt, iterations, KEYLEN, digest).toString("hex");

  const expected = Buffer.from(expectedHex, "hex");
  const actual = Buffer.from(actualHex, "hex");
  if (expected.length !== actual.length) return false;
  return crypto.timingSafeEqual(expected, actual);
}

