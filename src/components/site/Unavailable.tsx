import { Icon } from "../Icon";
import { dict, type Locale } from "@/lib/i18n";
import type { PublicBusiness } from "@/lib/types";

/** Shown instead of the website when the business is suspended (or not found). */
export function Unavailable({ business, locale }: { business: PublicBusiness | null; locale: Locale }) {
  const t = dict(locale);
  return (
    <div className="site unavailable" lang={locale} dir={locale === "ar" ? "rtl" : "ltr"}>
      <div className="unavailable-card">
        <div className="window-mini" aria-hidden="true" />
        <h1>{business ? business.name : t.notFoundTitle}</h1>
        <p>{business ? t.siteUnavailable : t.siteNotFound}</p>
        {business?.instagram_url && (
          <a className="btn btn-outline" href={business.instagram_url} target="_blank" rel="noopener noreferrer">
            <Icon name="instagram" size={17} /> {t.visitInstagram}
          </a>
        )}
      </div>
    </div>
  );
}
