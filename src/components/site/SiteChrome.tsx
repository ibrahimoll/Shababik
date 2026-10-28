import Image from "next/image";
import Link from "next/link";
import { Icon } from "../Icon";
import { LangToggle } from "./LangToggle";
import { SocialLinks } from "./SocialLinks";
import { dict, greetingName, type Locale } from "@/lib/i18n";
import { shortName, waLink } from "@/lib/whatsapp";
import type { Category, PublicBusiness } from "@/lib/types";

export function Brand({ business, home, locale }: { business: PublicBusiness; home: string; locale: Locale }) {
  const short = shortName(business.name);
  const rest = business.name.slice(short.length).trim();
  return (
    <Link href={home} className="brand" aria-label={dict(locale).homeAria(business.name)}>
      {business.logo_url && (
        <Image src={business.logo_url} alt="" width={96} height={96} className="brand-logo" priority />
      )}
      <span className="brand-text" lang="en" dir="ltr">
        <span className="brand-name">{short}</span>
        <span className="brand-sub">
          {rest && <span>{rest}</span>}
          {business.arabic_name && <span className="brand-ar" lang="ar" dir="rtl">{business.arabic_name}</span>}
        </span>
      </span>
    </Link>
  );
}

export function SiteHeader({ business, home, locale }: { business: PublicBusiness; home: string; locale: Locale }) {
  const t = dict(locale);
  const name = greetingName(business, locale, shortName(business.name));
  const anchor = (id: string) => (home === "/" ? `/#${id}` : `${home}#${id}`);
  return (
    <header className="site-header">
      <div className="wrap header-inner">
        <Brand business={business} home={home} locale={locale} />
        <nav aria-label="Main" className="main-nav">
          <a href={anchor("products")}>{t.nav.products}</a>
          <a href={anchor("collections")}>{t.nav.collections}</a>
          <a href={anchor("about")}>{t.nav.about}</a>
          <a href={anchor("contact")}>{t.nav.contact}</a>
        </nav>
        <div className="header-actions">
          <LangToggle locale={locale} label={t.switchTo} ariaLabel={t.switchLabel} />
          <SocialLinks business={business} locale={locale} whatsapp={false} />
          {business.whatsapp_number && (
            <a
              className="btn btn-dark btn-wa-header"
              href={waLink(business.whatsapp_number, t.wa.general(name))}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={t.chatAria(name)}
            >
              <Icon name="whatsapp" size={17} />
              <span className="hide-sm">{t.whatsapp}</span>
            </a>
          )}
        </div>
      </div>
    </header>
  );
}

export function SiteFooter({
  business,
  home,
  locale,
  collections = [],
}: {
  business: PublicBusiness;
  home: string;
  locale: Locale;
  collections?: Category[];
}) {
  const t = dict(locale);
  const f = t.footer;
  const isAr = locale === "ar";
  const base = home === "/" ? "" : home;
  const name = greetingName(business, locale, shortName(business.name));
  const wa = business.whatsapp_number;
  const handle = instagramHandle(business.instagram_url);
  return (
    <footer className="site-footer">
      <div className="wrap footer-grid">
        <div className="footer-brand">
          <Brand business={business} home={home} locale={locale} />
          <p className="footer-tagline">{f.tagline}</p>
          <SocialLinks business={business} locale={locale} className="social footer-social" />
        </div>

        <nav className="footer-col" aria-label={f.shop}>
          <h2>{f.shop}</h2>
          <ul>
            <li><Link href={`${base}/products`}>{t.allProducts}</Link></li>
            {collections.slice(0, 6).map((c) => (
              <li key={c.id}>
                <Link href={`${base}/products?category=${c.slug}`}>{isAr ? c.name_ar || c.name : c.name}</Link>
              </li>
            ))}
          </ul>
        </nav>

        <nav className="footer-col" aria-label={f.help}>
          <h2>{f.help}</h2>
          <ul>
            <li><a href={`${base || ""}/#how`}>{f.howToOrder}</a></li>
            <li><a href={`${base || ""}/#custom`}>{f.customOrders}</a></li>
            <li><Link href={`${base}/info#delivery`}>{f.delivery}</Link></li>
            <li><Link href={`${base}/info#returns`}>{f.returns}</Link></li>
            <li><Link href={`${base}/info#privacy`}>{f.privacy}</Link></li>
          </ul>
        </nav>

        <div className="footer-col">
          <h2>{f.contact}</h2>
          <ul className="footer-contact">
            {wa && (
              <li>
                <a href={waLink(wa, t.wa.general(name))} target="_blank" rel="noopener noreferrer">
                  <Icon name="whatsapp" size={16} /> <span dir="ltr">{business.phone || `+${wa}`}</span>
                </a>
              </li>
            )}
            {business.instagram_url && (
              <li>
                <a href={business.instagram_url} target="_blank" rel="noopener noreferrer">
                  <Icon name="instagram" size={16} /> <span dir="ltr">{handle}</span>
                </a>
              </li>
            )}
            {business.facebook_url && (
              <li>
                <a href={business.facebook_url} target="_blank" rel="noopener noreferrer">
                  <Icon name="facebook" size={16} /> {business.name}
                </a>
              </li>
            )}
            {business.location && (
              <li>
                <span><Icon name="pin" size={16} /> {business.location}</span>
              </li>
            )}
          </ul>
        </div>
      </div>

      <div className="footer-bottom">
        <div className="wrap footer-bottom-inner">
          <span>© {new Date().getFullYear()} {business.name}. {f.rights}</span>
          <Link href={`${base}/info`}>{f.policies}</Link>
        </div>
      </div>
    </footer>
  );
}

function instagramHandle(url: string | null): string {
  if (!url) return "";
  try {
    const h = new URL(url).pathname.split("/").filter(Boolean)[0];
    return h ? `@${h}` : "Instagram";
  } catch {
    return "Instagram";
  }
}

export function FloatingWhatsApp({ business, locale }: { business: PublicBusiness; locale: Locale }) {
  if (!business.whatsapp_number) return null;
  const t = dict(locale);
  const name = greetingName(business, locale, shortName(business.name));
  return (
    <a
      className="float-wa"
      href={waLink(business.whatsapp_number, t.wa.general(name))}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={t.chatAria(name)}
    >
      <Icon name="whatsapp" size={28} />
    </a>
  );
}
