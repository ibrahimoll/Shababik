import "server-only";
import { headers } from "next/headers";
import { createServiceClient } from "./supabase/service";

// ---------------------------------------------------------------- client IP

/** Best-effort client IP (Netlify / Vercel / generic proxy headers). */
export async function clientIp(): Promise<string> {
  const h = await headers();
  return (
    h.get("x-nf-client-connection-ip") ??
    h.get("x-real-ip") ??
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown"
  );
}

// ---------------------------------------------------------------- brute-force lockout

const WINDOW_MINUTES = 15;
const MAX_FAILS_PER_EMAIL = 5; // per account
const MAX_FAILS_PER_IP = 30; // per network (covers password-spraying across emails)

export const LOCKED_MESSAGE = `Too many attempts. For your security, please wait ${WINDOW_MINUTES} minutes and try again.`;

type AttemptKind = "password";

/** True when this email or IP has too many recent failures. Fails closed only on clear signals. */
export async function isLockedOut(kind: AttemptKind, email: string, ip: string): Promise<boolean> {
  const db = createServiceClient();
  const since = new Date(Date.now() - WINDOW_MINUTES * 60_000).toISOString();
  const [byEmail, byIp] = await Promise.all([
    db.from("login_attempts").select("id", { count: "exact", head: true })
      .eq("kind", kind).eq("email", email.toLowerCase()).eq("success", false).gte("created_at", since),
    db.from("login_attempts").select("id", { count: "exact", head: true })
      .eq("ip", ip).eq("success", false).gte("created_at", since),
  ]);
  return (byEmail.count ?? 0) >= MAX_FAILS_PER_EMAIL || (byIp.count ?? 0) >= MAX_FAILS_PER_IP;
}

export async function recordAttempt(kind: AttemptKind, email: string, ip: string, success: boolean) {
  const db = createServiceClient();
  await db.from("login_attempts").insert({ kind, email: email.toLowerCase(), ip, success });
  if (success) {
    // a successful login clears that account's failure streak
    await db.from("login_attempts").delete().eq("kind", kind).eq("email", email.toLowerCase()).eq("success", false);
  }
  // keep the table small
  await db.from("login_attempts").delete().lt("created_at", new Date(Date.now() - 30 * 86_400_000).toISOString());
}

/** Small random delay on failures so responses don't leak timing information. */
export function failureDelay() {
  return new Promise((r) => setTimeout(r, 400 + Math.random() * 400));
}

// ---------------------------------------------------------------- password rules

export function passwordProblem(pw: string): string | null {
  if (pw.length < 12) return "Use at least 12 characters.";
  if (!/[a-z]/.test(pw) || !/[A-Z]/.test(pw) || !/[0-9]/.test(pw)) {
    return "Use upper-case letters, lower-case letters and numbers.";
  }
  if (/^(.)\1+$/.test(pw) || /password|123456|qwerty|shababik/i.test(pw)) {
    return "This password is too easy to guess.";
  }
  return null;
}

// ---------------------------------------------------------------- audit log

export type AuditInput = {
  action: string;
  businessId?: string | null;
  actor?: { id?: string | null; email?: string | null; role?: string | null };
  target?: string | null;
  details?: Record<string, unknown>;
};

/** Writes an audit entry. Never throws — auditing must not break the user's action. */
export async function audit(entry: AuditInput) {
  try {
    await createServiceClient().from("audit_log").insert({
      action: entry.action,
      business_id: entry.businessId ?? null,
      actor_id: entry.actor?.id ?? null,
      actor_email: entry.actor?.email ?? null,
      actor_role: entry.actor?.role ?? null,
      target: entry.target ?? null,
      details: entry.details ?? null,
      ip: await clientIp(),
    });
  } catch {
    // ignore
  }
}
