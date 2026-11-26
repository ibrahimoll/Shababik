import { Storefront } from "@/components/site/Storefront";
import { Unavailable } from "@/components/site/Unavailable";
import { getBusinessForRequest, getCatalog } from "@/lib/site";
import { siteMetadata } from "@/lib/seo";
import { getLocale } from "@/lib/locale";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  return siteMetadata(await getBusinessForRequest(), await getLocale());
}

export default async function HomePage() {
  const locale = await getLocale();
  const business = await getBusinessForRequest();
  if (!business || business.is_suspended) return <Unavailable business={business} locale={locale} />;
  const { categories, products } = await getCatalog(business.id);
  // shop details for Google (name, address, phone, links)
  const site = business.domain ? `https://${business.domain}` : undefined;
  const shop = {
    "@context": "https://schema.org",
    "@type": "Store",
    name: business.name,
    alternateName: business.arabic_name ?? undefined,
    description: "Supplies & materials for all kinds of crafts",
    url: site,
    image: site ? `${site}/og.jpg` : undefined,
    telephone: business.phone ?? (business.whatsapp_number ? `+${business.whatsapp_number}` : undefined),
    address: { "@type": "PostalAddress", addressLocality: business.location ?? undefined, addressCountry: "LB" },
    sameAs: [business.instagram_url, business.facebook_url].filter(Boolean),
  };
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(shop).replace(/</g, "\\u003c") }} />
      <Storefront business={business} categories={categories} products={products} home="/" locale={locale} />
    </>
  );
}
