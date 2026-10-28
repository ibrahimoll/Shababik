/**
 * The Super Admin console lives at a secret address (e.g. "/control-k8f2q9x7").
 * Only its SHA-256 hash is configured (SUPER_ADMIN_PATH_HASH) — the address itself is never
 * stored. Internally the pages stay under /super-admin, but that address returns 404 to everyone —
 * middleware rewrites the secret address to it. Without a valid hash the console is unreachable.
 *
 * Edge-safe: imported by middleware. Server code builds links with saPath() from "./sa-link".
 */

/** The internal route folder. Never linked; requests to it get a 404. */
export const SA_INTERNAL = "/super-admin";

/** Request header set by middleware with the secret address of the current request. */
export const SA_BASE_HEADER = "x-sa-base";
/** Cookie remembering the secret address, so pages outside the console can link back to it. */
export const SA_BASE_COOKIE = "sa_base";

const SEGMENT = /^\/[A-Za-z0-9_-]{10,64}$/;
const RESERVED = ["/super-admin", "/admin", "/s/", "/products", "/info", "/_next", "/api"];

async function sha256Hex(text: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
}

/** True when `base` (the first path segment, e.g. "/console-…") is the secret console address. */
export async function isSaBase(base: string): Promise<boolean> {
  const expected = process.env.SUPER_ADMIN_PATH_HASH?.trim().toLowerCase() ?? "";
  if (!/^[0-9a-f]{64}$/.test(expected) || !SEGMENT.test(base)) return false;
  if (RESERVED.some((r) => base === r.replace(/\/$/, "") || base.startsWith(r))) return false;
  const actual = await sha256Hex(base);
  let diff = 0; // constant-time compare
  for (let i = 0; i < 64; i++) diff |= actual.charCodeAt(i) ^ expected.charCodeAt(i);
  return diff === 0;
}

/** The only email allowed to use the Super Admin console. */
export function superAdminEmail(): string | null {
  return process.env.SUPER_ADMIN_EMAIL?.trim().toLowerCase() || null;
}
