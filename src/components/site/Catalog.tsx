import Link from "next/link";
import { Icon } from "../Icon";
import { ProductCard } from "./ProductCard";
import { FloatingWhatsApp, SiteFooter, SiteHeader } from "./SiteChrome";
import { dict, greetingName, localizeCategories, localizeProducts, type Locale } from "@/lib/i18n";
import { shortName, waLink } from "@/lib/whatsapp";
import { matchesSearch } from "@/lib/search";
import type { Category, Product, PublicBusiness } from "@/lib/types";

/** All products, filterable by category with plain links (no client JS needed). */
export function Catalog({
  business,
  categories: rawCategories,
  products: rawProducts,
  home,
  activeSlug,
  query = "",
  locale,
}: {
  business: PublicBusiness;
  categories: Category[];
  products: Product[];
  home: string;
  activeSlug?: string;
  query?: string;
  locale: Locale;
}) {
  const t = dict(locale);
  const categories = localizeCategories(rawCategories, locale);
  const products = localizeProducts(rawProducts, locale);
  const greet = greetingName(business, locale, shortName(business.name));
  const productsHref = home === "/" ? "/products" : `${home}/products`;
  const active = categories.find((c) => c.slug === activeSlug);
  const used = new Set(products.map((p) => p.category_id));
  const visibleCats = categories.filter((c) => used.has(c.id) || c.image_url);
  const catName = new Map(categories.map((c) => [c.id, c.name]));
  const q = query.trim().slice(0, 80);
  const catNames = new Map(rawCategories.map((c) => [c.id, [c.name, c.name_ar ?? ""]]));
  const rawById = new Map(rawProducts.map((p) => [p.id, p]));
  // available pieces first; search looks at both languages so English words work on the Arabic site too
  const list = (active ? products.filter((p) => p.category_id === active.id) : products)
    .filter((p) => matchesSearch(rawById.get(p.id)!, catNames.get(p.category_id) ?? [], q))
    .sort((a, b) => Number(b.is_available) - Number(a.is_available));

  return (
    <div className="site" lang={locale} dir={locale === "ar" ? "rtl" : "ltr"}>
      <a href="#main" className="skip-link">{t.skip}</a>
      <SiteHeader business={business} home={home} locale={locale} />
      <main id="main" className="section wrap">
        <p className="kicker">{t.shopKicker}</p>
        <h1 className="page-title">{active ? active.name : t.allProducts}</h1>

        <form role="search" action={productsHref} className="catalog-search">
          {active && <input type="hidden" name="category" value={active.slug} />}
          <label htmlFor="q" className="sr-only">{t.search.label}</label>
          <input id="q" name="q" type="search" defaultValue={q} placeholder={t.search.placeholder} maxLength={80} autoComplete="off" enterKeyHint="search" />
          <button type="submit" className="btn btn-dark">{t.search.button}</button>
        </form>

        <nav className="chips" aria-label={t.filterAria}>
          <Link href={productsHref} className="chip" aria-current={!active ? "page" : undefined}>{t.all}</Link>
          {visibleCats.map((c) => (
            <Link key={c.id} href={`${productsHref}?category=${c.slug}`} className="chip" aria-current={active?.id === c.id ? "page" : undefined}>
              {c.name}
            </Link>
          ))}
        </nav>

        {activeSlug && !active && <p className="catalog-note" role="status">{t.categoryMissing}</p>}
        {q && (
          <p className="catalog-note" role="status">
            {list.length ? t.search.results(list.length, q) : t.search.none(q)}{" "}
            <Link href={active ? `${productsHref}?category=${active.slug}` : productsHref}>{t.search.clear}</Link>
          </p>
        )}

        {list.length ? (
          <div className="product-grid">
            {list.map((p, i) => (
              <ProductCard key={p.id} product={p} categoryName={catName.get(p.category_id)} business={business} index={i} locale={locale} />
            ))}
          </div>
        ) : (
          <div className="empty">
            {!q && <p>{t.collectionEmpty}</p>}
            {business.whatsapp_number && (
              <a className="btn btn-dark" href={waLink(business.whatsapp_number, t.wa.general(greet))} target="_blank" rel="noopener noreferrer">
                <Icon name="whatsapp" size={17} /> {t.askUs}
              </a>
            )}
          </div>
        )}

        {business.whatsapp_number && (
          <div className="custom-cta" style={{ marginTop: 56 }}>
            <div>
              <h2>{t.customTitle}</h2>
              <p>{t.customText}</p>
            </div>
            <a className="btn btn-light" href={waLink(business.whatsapp_number, t.wa.custom(greet))} target="_blank" rel="noopener noreferrer">
              <Icon name="whatsapp" size={18} /> {t.customButton}
            </a>
          </div>
        )}
      </main>
      <SiteFooter business={business} home={home} locale={locale} collections={visibleCats} />
      <FloatingWhatsApp business={business} locale={locale} />
    </div>
  );
}
