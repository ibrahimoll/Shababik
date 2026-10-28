import { Catalog } from "@/components/site/Catalog";
import { Unavailable } from "@/components/site/Unavailable";
import { getBusinessForRequest, getCatalog } from "@/lib/site";
import { siteMetadata } from "@/lib/seo";
import { getLocale } from "@/lib/locale";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  return siteMetadata(await getBusinessForRequest(), await getLocale(), "/products");
}

export default async function ProductsPage({ searchParams }: { searchParams: Promise<{ category?: string }> }) {
  const locale = await getLocale();
  const business = await getBusinessForRequest();
  if (!business || business.is_suspended) return <Unavailable business={business} locale={locale} />;
  const { categories, products } = await getCatalog(business.id);
  const { category } = await searchParams;
  return <Catalog business={business} categories={categories} products={products} home="/" activeSlug={category} locale={locale} />;
}
