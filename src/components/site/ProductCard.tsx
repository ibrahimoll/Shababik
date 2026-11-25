import { ProductImage } from "./ProductImage";
import { CardActions } from "./OrderList";
import { dict, greetingName, type Locale } from "@/lib/i18n";
import { shortName } from "@/lib/whatsapp";
import { formatPrice, parseOptions } from "@/lib/utils";
import type { Product, PublicBusiness } from "@/lib/types";

/** `product` is already localized (name / description in the visitor's language). */
export function ProductCard({
  product,
  categoryName,
  business,
  index,
  locale,
}: {
  product: Product;
  categoryName?: string;
  business: PublicBusiness;
  index: number;
  locale: Locale;
}) {
  const t = dict(locale);
  const unavailable = !product.is_available;
  const options = parseOptions(product.options);
  const priced = options.filter((o) => o.price !== null).map((o) => o.price as number);
  const variesInPrice = new Set(priced).size > 1;
  // prices written inside the option tags themselves (e.g. "Large — 50,000 LBP"): no separate price
  const pricesInTags = !priced.length && options.some((o) => /LBP|ل\.ل|USD|\$/i.test(o.label));
  const priceLabel = product.ask_for_price
    ? t.askForPrice
    : variesInPrice
      ? t.from(formatPrice(Math.min(...priced), false))
      : formatPrice(priced[0] ?? product.price, false, t.askForPrice);
  // message names the product and links back to it, so customers don't need screenshots
  const site = business.domain ? `https://${business.domain}` : process.env.NEXT_PUBLIC_SITE_URL;
  const link = site ? `\n${site}/products?q=${encodeURIComponent(product.name)}` : "";
  const canOrder = !!business.whatsapp_number && !unavailable;
  return (
    <article className={`product-card${unavailable ? " is-unavailable" : ""}`}>
      <div className="product-photo">
        <ProductImage src={product.image_url} alt={product.name} index={index} priority={index < 2} />
        {unavailable && <span className="badge badge-muted">{t.unavailableBadge}</span>}
      </div>
      <div className="product-info">
        {categoryName && <p className="product-cat">{categoryName}</p>}
        <h3>{product.name}</h3>
        {product.short_description && <p className="product-desc">{product.short_description}</p>}
        {options.length > 0 && !canOrder &&
          (priced.length ? (
            <ul className="options">
              {options.map((o) => (
                <li key={o.label}>
                  <span>{o.label}</span>
                  {o.price !== null && !product.ask_for_price && <b>{formatPrice(o.price, false)}</b>}
                </li>
              ))}
            </ul>
          ) : (
            <ul className="option-chips">
              {options.map((o) => (
                <li key={o.label}>{o.label}</li>
              ))}
            </ul>
          ))}
        <div className="product-foot">
          {!pricesInTags && (
            <span className={`price${product.ask_for_price || (product.price == null && !priced.length) ? " price-ask" : ""}`}>
              {priceLabel}
            </span>
          )}
          {unavailable && <span className="unavail-note">{t.notAvailable}</span>}
        </div>
        {canOrder && (
          <CardActions
            id={product.id}
            name={product.name}
            price={product.ask_for_price || pricesInTags || variesInPrice ? "" : priceLabel}
            options={options.map((o) => ({ label: o.label, price: o.price !== null && !product.ask_for_price ? formatPrice(o.price, false) : "" }))}
            whatsapp={business.whatsapp_number!}
            greet={greetingName(business, locale, shortName(business.name))}
            link={link}
            locale={locale}
          />
        )}
      </div>
    </article>
  );
}
