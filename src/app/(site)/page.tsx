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
  return <Storefront business={business} categories={categories} products={products} home="/" locale={locale} />;
}
