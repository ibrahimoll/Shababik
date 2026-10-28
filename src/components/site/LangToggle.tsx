"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { LOCALE_COOKIE, type Locale } from "@/lib/i18n";

/** EN ⇄ عربي switch. Remembers the choice for a year on this device. */
export function LangToggle({ locale, label, ariaLabel }: { locale: Locale; label: string; ariaLabel: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const next: Locale = locale === "ar" ? "en" : "ar";
  return (
    <button
      type="button"
      className="lang-toggle"
      lang={next}
      aria-label={ariaLabel}
      disabled={pending}
      onClick={() => {
        document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=31536000; samesite=lax`;
        start(() => router.refresh());
      }}
    >
      {label}
    </button>
  );
}
