import "server-only";
import { cookies, headers } from "next/headers";
import { LOCALE_COOKIE, parseLocale, type Locale } from "./i18n";

/** Visitor's chosen language (cookie), otherwise their browser language, otherwise English. */
export async function getLocale(): Promise<Locale> {
  const chosen = parseLocale((await cookies()).get(LOCALE_COOKIE)?.value);
  if (chosen) return chosen;
  const accept = (await headers()).get("accept-language") ?? "";
  return /^\s*ar\b/i.test(accept) ? "ar" : "en";
}
