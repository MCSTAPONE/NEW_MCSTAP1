import { createHash, randomBytes } from "crypto";

export const TRIAL_DAYS = 30;

const LICENSE_SALT = "mcstap-license-secret-v1";
const GROUP_LENGTH = 5;
const BODY_LENGTH = GROUP_LENGTH * 3;
const CHECKSUM_LENGTH = 5;
const KEY_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no I/O/0/1

function checksumFor(body: string): string {
  return createHash("sha256")
    .update(`${body}:${LICENSE_SALT}`)
    .digest("hex")
    .toUpperCase()
    .slice(0, CHECKSUM_LENGTH);
}

export function isValidLicenseKeyFormat(key: string): boolean {
  return /^[A-Z0-9]{5}-[A-Z0-9]{5}-[A-Z0-9]{5}-[A-Z0-9]{5}$/.test(key.trim().toUpperCase());
}

export function isValidLicenseKey(key: string): boolean {
  const normalized = key.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (normalized.length !== BODY_LENGTH + CHECKSUM_LENGTH) return false;

  const body = normalized.slice(0, BODY_LENGTH);
  const providedChecksum = normalized.slice(BODY_LENGTH);
  return checksumFor(body) === providedChecksum;
}

export function maskLicenseKey(key: string): string {
  const parts = key.split("-");
  if (parts.length !== 4) return "****";
  return `${parts[0]}-****-****-${parts[3]}`;
}

/** Generates a valid demo key; used only for issuing test/trial keys, never called from the activation path. */
export function generateLicenseKey(): string {
  const bytes = randomBytes(BODY_LENGTH);
  let body = "";
  for (let i = 0; i < BODY_LENGTH; i++) {
    body += KEY_ALPHABET[bytes[i] % KEY_ALPHABET.length];
  }
  const checksum = checksumFor(body);
  return `${body.slice(0, 5)}-${body.slice(5, 10)}-${body.slice(10, 15)}-${checksum}`;
}
