import { redis } from "./redis";
import { randomUUID } from "crypto";

const SESSION_TTL_SECONDS = 30 * 60; // 30 menit
const SESSION_PREFIX = "booth:session:";
const RATE_LIMIT_PREFIX = "booth:ratelimit:";
const LOGIN_RATE_LIMIT_PREFIX = "booth:login-ratelimit:";

export type WizardStep =
  | "frame_selected"
  | "capture_done"
  | "voice_done"
  | "composed";

export interface WizardSession {
  weddingId: string;
  frameId?: string;
  mediaType?: "PHOTO" | "VIDEO";
  slotCount?: number;
  guestName?: string;
  rawPhotoUrls?: string[];
  rawVideoUrl?: string;
  voiceNoteUrl?: string;
  voiceDuration?: number;
  composedUrl?: string;
  step?: WizardStep;
}

export async function createWizardSession(weddingId: string): Promise<string> {
  const token = randomUUID();
  const data: WizardSession = { weddingId };
  await redis.set(SESSION_PREFIX + token, JSON.stringify(data), {
    ex: SESSION_TTL_SECONDS,
  });
  return token;
}

export async function getWizardSession(
  token: string
): Promise<WizardSession | null> {
  const raw = await redis.get<string>(SESSION_PREFIX + token);
  if (!raw) return null;
  return typeof raw === "string" ? JSON.parse(raw) : (raw as unknown as WizardSession);
}

export async function patchWizardSession(
  token: string,
  patch: Partial<WizardSession>
): Promise<WizardSession> {
  const current = (await getWizardSession(token)) ?? ({} as WizardSession);
  const next = { ...current, ...patch };
  await redis.set(SESSION_PREFIX + token, JSON.stringify(next), {
    ex: SESSION_TTL_SECONDS,
  });
  return next;
}

export async function clearWizardSession(token: string): Promise<void> {
  await redis.del(SESSION_PREFIX + token);
}

/**
 * Rate limit sederhana: maksimal `limit` submission per token dalam `windowSeconds`.
 * Dipanggil sebelum menyimpan GuestSubmission final.
 */
export async function checkSubmissionRateLimit(
  token: string,
  limit = 3,
  windowSeconds = 60
): Promise<boolean> {
  const key = RATE_LIMIT_PREFIX + token;
  const count = await redis.incr(key);
  if (count === 1) {
    await redis.expire(key, windowSeconds);
  }
  return count <= limit;
}

/**
 * Rate limit percobaan login vendor, dicek SEBELUM verifikasi password supaya
 * brute-force tidak bisa mencoba banyak password dalam waktu singkat.
 * Di-key per kombinasi IP + email supaya satu penyerang tidak bisa menghabiskan
 * jatah percobaan akun lain, dan satu akun tidak bisa diserang dari banyak IP
 * tanpa masing-masing IP kena limitnya sendiri.
 */
export async function checkLoginRateLimit(
  ip: string,
  email: string,
  limit = 5,
  windowSeconds = 15 * 60
): Promise<boolean> {
  const key = `${LOGIN_RATE_LIMIT_PREFIX}${ip}:${email.toLowerCase()}`;
  const count = await redis.incr(key);
  if (count === 1) {
    await redis.expire(key, windowSeconds);
  }
  return count <= limit;
}

/** Reset jatah rate limit login setelah login berhasil. */
export async function clearLoginRateLimit(ip: string, email: string): Promise<void> {
  const key = `${LOGIN_RATE_LIMIT_PREFIX}${ip}:${email.toLowerCase()}`;
  await redis.del(key);
}
