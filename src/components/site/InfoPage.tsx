import { Icon } from "../Icon";
import { FloatingWhatsApp, SiteFooter, SiteHeader } from "./SiteChrome";
import { dict, greetingName, type Locale } from "@/lib/i18n";
import { shortName, waLink } from "@/lib/whatsapp";
import type { Category, Product, PublicBusiness } from "@/lib/types";

/** Ordering, delivery, returns and privacy — linked from the footer. */
export function InfoPage({
  business,
  categories,
  products,
  home,
  locale,
}: {
  business: PublicBusiness;
  categories: Category[];
  products: Product[];
  home: string;
  locale: Locale;
}) {
  const t = dict(locale);
  const greet = greetingName(business, locale, shortName(business.name));
  const used = new Set(products.map((p) => p.category_id));
  const collections = categories.filter((c) => used.has(c.id) || c.image_url);
  return (
    <div className="site" lang={locale} dir={locale === "ar" ? "rtl" : "ltr"}>
      <a href="#main" className="skip-link">{t.skip}</a>
      <SiteHeader business={business} home={home} locale={locale} />
      <main id="main" className="section wrap info-page">
        <p className="kicker">{t.info.kicker}</p>
        <h1 className="page-title">{t.info.title}</h1>
        <p className="lead">{t.info.lead}</p>

        <nav className="chips info-toc" aria-label={t.info.title}>
          {t.info.sections.map((s) => (
            <a key={s.id} href={`#${s.id}`} className="chip">{s.title}</a>
          ))}
        </nav>

        <div className="info-sections">
          {t.info.sections.map((s) => (
            <section key={s.id} id={s.id} className="info-card" aria-labelledby={`${s.id}-title`}>
              <h2 id={`${s.id}-title`}>{s.title}</h2>
              <ul>
                {s.body.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            </section>
          ))}
        </div>

        {business.whatsapp_number && (
          <div className="info-help">
            <b>{t.info.questions}</b>
            <a className="btn btn-dark" href={waLink(business.whatsapp_number, t.wa.general(greet))} target="_blank" rel="noopener noreferrer">
              <Icon name="whatsapp" size={17} /> {t.askUs}
            </a>
          </div>
        )}
      </main>
      <SiteFooter business={business} home={home} locale={locale} collections={collections} />
      <FloatingWhatsApp business={business} locale={locale} />
    </div>
  );
}
