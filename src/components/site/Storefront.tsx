import Image from "next/image";
import Link from "next/link";
import { Icon } from "../Icon";
import { FeaturedFilter } from "./FeaturedFilter";
import { ProductCard } from "./ProductCard";
import { ProductImage } from "./ProductImage";
import { FloatingWhatsApp, SiteFooter, SiteHeader } from "./SiteChrome";
import { dict, greetingName, localizeBusiness, localizeProducts, type Locale } from "@/lib/i18n";
import { showcase } from "@/lib/site";
import { shortName, waLink } from "@/lib/whatsapp";
import type { Category, Product, PublicBusiness } from "@/lib/types";

export function Storefront({
  business: rawBusiness,
  categories,
  products: rawProducts,
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
  const isAr = locale === "ar";
  const business = localizeBusiness(rawBusiness, locale);
  const products = localizeProducts(rawProducts, locale);
  const productsHref = home === "/" ? "/products" : `${home}/products`;
  const catLabel = (c: Category) => (isAr ? c.name_ar || c.name : c.name);
  const catName = new Map(categories.map((c) => [c.id, catLabel(c)]));
  // homepage showcase: 10 for "All" and 10 per category, in the order set on Admin → Arrange
  const FEATURED_LIMIT = 10;
  const { all: featured, byCategory } = showcase(products, categories, FEATURED_LIMIT);
  const card = (p: Product, i: number) => ({
    id: p.id,
    card: <ProductCard product={p} categoryName={catName.get(p.category_id)} business={business} index={i} locale={locale} />,
  });
  const featuredTabs = byCategory.map((g) => {
    const c = categories.find((x) => x.id === g.id)!;
    return { id: g.id, label: catLabel(c), items: g.items.map(card) };
  });
  const short = shortName(business.name);
  const greet = greetingName(business, locale, short);
  const displayName = isAr && business.arabic_name ? business.arabic_name : short;
  const wa = business.whatsapp_number;
  const place = business.location || (isAr ? "لبنان" : "Lebanon");

  const collections = categories
    .map((c) => ({ ...c, items: products.filter((p) => p.category_id === c.id) }))
    // show a collection when it has products or its own cover photo
    .filter((c) => c.items.length > 0 || c.image_url)
    .slice(0, 12);

  const steps = [
    { icon: "heart" as const, title: t.steps[0][0], text: t.steps[0][1] },
    { icon: "brush" as const, title: t.steps[1][0], text: t.steps[1][1] },
    { icon: "whatsapp" as const, title: t.steps[2][0], text: t.steps[2][1] },
  ];

  return (
    <div className="site" lang={locale} dir={isAr ? "rtl" : "ltr"}>
      <a href="#main" className="skip-link">{t.skip}</a>
      <SiteHeader business={business} home={home} locale={locale} />

      <main id="main">
        {/* HERO */}
        <section className="hero wrap">
          <div className="hero-copy">
            <p className="kicker">{t.handmadeIn(place)}</p>
            <h1>{business.hero_title || t.heroTitle}</h1>
            <p className="hero-desc">{business.hero_description || t.heroDesc}</p>
            <div className="ctas">
              <a className="btn btn-dark" href="#products">
                {t.viewProducts} <Icon name="arrow" size={17} className="flip-rtl" />
              </a>
              {wa && (
                <a className="btn btn-outline" href={waLink(wa, t.wa.general(greet))} target="_blank" rel="noopener noreferrer">
                  <Icon name="whatsapp" size={17} /> {t.orderWhatsApp}
                </a>
              )}
            </div>
          </div>

          <div className="hero-art">
            <div className="window window-main">
              <Image
                src="/hero/hero-main.png"
                alt="Handmade candle in a blue ceramic jar, pottery vase, aqua resin coaster and wooden tray"
                fill
                priority
                sizes="(max-width: 900px) 80vw, 440px"
                className="cover-img"
              />
            </div>
            <div className="window window-side">
              <Image
                src="/hero/hero-side.png"
                alt="Handmade gift wrapped in white paper with a navy ribbon"
                fill
                sizes="(max-width: 900px) 40vw, 200px"
                className="cover-img"
              />
            </div>
            <div className="hero-tag">
              <b>{displayName}</b>
              {!isAr && business.arabic_name && <span className="ar" lang="ar" dir="rtl">{business.arabic_name}</span>}
              {isAr && <span className="ar" lang="en" dir="ltr">{short}</span>}
              <span>{t.personalTouch}</span>
            </div>
          </div>
        </section>

        {/* COLLECTIONS */}
        {collections.length > 0 && (
          <section className="section wrap" id="collections" aria-labelledby="collections-title">
            <p className="kicker">{t.collectionsKicker}</p>
            <h2 id="collections-title">{t.collectionsTitle}</h2>
            <p className="lead">
              {t.collectionsLead[0]}
              <span lang="ar" dir="rtl" className="ar-inline">شبّاك</span>
              {t.collectionsLead[1]}
            </p>
            <div className="collections">
              {collections.map((c, i) => {
                const cover = c.image_url ?? c.items.find((p) => p.image_url)?.image_url ?? null;
                const secondary = isAr ? (c.name_ar ? c.name : null) : c.name_ar;
                return (
                  <Link key={c.id} href={`${productsHref}?category=${c.slug}`} className="collection">
                    <div className="collection-photo">
                      <ProductImage src={cover} alt={catLabel(c)} index={i + 1} sizes="(max-width: 640px) 50vw, 200px" />
                    </div>
                    <span className="collection-name">{catLabel(c)}</span>
                    {secondary && (
                      <span className="collection-ar" lang={isAr ? "en" : "ar"} dir={isAr ? "ltr" : "rtl"}>{secondary}</span>
                    )}
                    <span className="collection-count">{c.items.length ? t.pieces(c.items.length) : t.comingSoon}</span>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        {/* FEATURED */}
        <section className="section wrap" id="products" aria-labelledby="featured-title">
          <div className="section-head">
            <div>
              <p className="kicker">{t.featuredKicker}</p>
              <h2 id="featured-title">{t.featuredTitle}</h2>
            </div>
            {products.length > featured.length && (
              <Link href={productsHref} className="link-arrow">
                {t.viewAll} <Icon name="arrow" size={16} className="flip-rtl" />
              </Link>
            )}
          </div>
          {featured.length ? (
            <FeaturedFilter
              tabs={featuredTabs}
              all={featured.map(card)}
              allLabel={t.all}
              ariaLabel={t.filterAria}
              prevLabel={isAr ? "المنتجات السابقة" : "Previous products"}
              nextLabel={isAr ? "المنتجات التالية" : "Next products"}
            />
          ) : (
            <p className="empty">{t.featuredEmpty}</p>
          )}
        </section>

        {/* CUSTOM ORDER */}
        <section className="wrap" id="custom" aria-labelledby="custom-title">
          <div className="custom-cta">
            <div>
              <h2 id="custom-title">{t.customTitle}</h2>
              <p>{t.customText}</p>
            </div>
            {wa && (
              <a className="btn btn-light" href={waLink(wa, t.wa.custom(greet))} target="_blank" rel="noopener noreferrer">
                <Icon name="whatsapp" size={18} /> {t.customButton}
              </a>
            )}
          </div>
        </section>

        {/* ABOUT */}
        <section className="section wrap about" id="about" aria-labelledby="about-title">
          <div className="about-art reveal">
            <div className="about-photo">
              <Image
                src="/about/about-studio.png"
                alt="Hands pressing dried flowers into aqua resin at a workbench with blue ceramics"
                fill
                sizes="(max-width: 900px) 90vw, 460px"
                className="cover-img"
              />
            </div>
            <div className="about-stamp" aria-hidden="true">
              <span>{t.madeByHand}</span>
              <b lang="ar" dir="rtl">{business.arabic_name || short}</b>
            </div>
          </div>
          <div className="about-copy reveal">
            <p className="kicker">{t.aboutKicker(displayName)}</p>
            <h2 id="about-title">{t.aboutTitle}</h2>
            <p className="about-text">{business.about_text || t.aboutDefault(isAr ? displayName : business.name)}</p>
            <ul className="values">
              <li><Icon name="heart" size={18} /> {t.values[0]}</li>
              <li><Icon name="brush" size={18} /> {t.values[1]}</li>
              <li><Icon name="gift" size={18} /> {t.values[2]}</li>
            </ul>
            {business.instagram_url && (
              <a className="link-arrow" href={business.instagram_url} target="_blank" rel="noopener noreferrer">
                <Icon name="instagram" size={17} /> {t.seeInstagram}
              </a>
            )}
          </div>
        </section>

        {/* HOW TO ORDER */}
        <section className="how" id="how" aria-labelledby="how-title">
          <div className="wrap">
            <div className="how-head reveal">
              <p className="kicker">{t.howKicker}</p>
              <h2 id="how-title">{t.howTitle}</h2>
              <p className="how-lead">{t.howLead}</p>
            </div>
            <ol className="steps">
              {steps.map((s, i) => (
                <li key={s.title} className="reveal">
                  <span className="step-num" aria-hidden="true">0{i + 1}</span>
                  <span className={`step-ico${s.icon === "whatsapp" ? " is-wa" : ""}`}>
                    <Icon name={s.icon} size={24} />
                  </span>
                  <b>{s.title}</b>
                  <span className="step-text">{s.text}</span>
                </li>
              ))}
            </ol>
            {wa && (
              <div className="how-cta reveal">
                <a className="btn btn-dark" href={waLink(wa, t.wa.general(greet))} target="_blank" rel="noopener noreferrer">
                  <Icon name="whatsapp" size={18} /> {t.startWhatsApp}
                </a>
              </div>
            )}
          </div>
        </section>

        {/* CONTACT */}
        <section className="section wrap" id="contact" aria-labelledby="contact-title">
          <p className="kicker">{t.contactKicker}</p>
          <h2 id="contact-title">{t.contactTitle}</h2>
          <div className="contact-grid">
            {wa && (
              <a className="contact-card" href={waLink(wa, t.wa.general(greet))} target="_blank" rel="noopener noreferrer">
                <span className="contact-ico wa"><Icon name="whatsapp" size={20} /></span>
                <span><small>{t.labels.whatsapp}</small><span dir="ltr">{business.phone || `+${wa}`}</span></span>
              </a>
            )}
            {business.instagram_url && (
              <a className="contact-card" href={business.instagram_url} target="_blank" rel="noopener noreferrer" aria-label={t.instagramAria(greet)}>
                <span className="contact-ico"><Icon name="instagram" size={20} /></span>
                <span><small>{t.labels.instagram}</small><span dir="ltr">{instagramHandle(business.instagram_url)}</span></span>
              </a>
            )}
            {business.facebook_url && (
              <a className="contact-card" href={business.facebook_url} target="_blank" rel="noopener noreferrer" aria-label={t.facebookAria(greet)}>
                <span className="contact-ico"><Icon name="facebook" size={20} /></span>
                <span><small>{t.labels.facebook}</small>{business.name}</span>
              </a>
            )}
            {business.location && (
              <div className="contact-card">
                <span className="contact-ico"><Icon name="pin" size={20} /></span>
                <span><small>{t.labels.location}</small>{business.location}</span>
              </div>
            )}
          </div>
        </section>
      </main>

      <SiteFooter business={business} home={home} locale={locale} collections={collections} />
      <FloatingWhatsApp business={business} locale={locale} />
    </div>
  );
}

function instagramHandle(url: string): string {
  try {
    const handle = new URL(url).pathname.split("/").filter(Boolean)[0];
    return handle ? `@${handle}` : "Instagram";
  } catch {
    return "Instagram";
  }
}
