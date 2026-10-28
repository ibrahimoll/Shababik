import "server-only";
import { cookies, headers } from "next/headers";
import { SA_BASE_COOKIE, SA_BASE_HEADER, isSaBase } from "./sa-path";

/**
 * Public URL of a Super Admin page, e.g. await saPath("/settings").
 * The secret address only exists as a hash in the config, so it is taken from the current
 * request (set by middleware) or from the cookie set when the console was last opened in this
 * browser — both re-checked against the hash. Returns null when unknown.
 */
export async function saBaseFromRequest(): Promise<string | null> {
  const candidates = [(await headers()).get(SA_BASE_HEADER), (await cookies()).get(SA_BASE_COOKIE)?.value];
  for (const base of candidates) if (base && (await isSaBase(base))) return base;
  return null;
}

/** Falls back to "/" when the secret address is unknown. */
export async function saPath(sub = ""): Promise<string> {
  const base = await saBaseFromRequest();
  return base ? `${base}${sub}` : "/";
}
