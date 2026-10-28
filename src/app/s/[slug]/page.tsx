import { Storefront } from "@/components/site/Storefront";
import { Unavailable } from "@/components/site/Unavailable";
import { getBusinessBySlug, getCatalog } from "@/lib/site";
import { siteMetadata } from "@/lib/seo";
import { getLocale } from "@/lib/locale";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Params) {
  const meta = siteMetadata(await getBusinessBySlug((await params).slug), await getLocale());
  return { ...meta, robots: { index: false, follow: false } };
}

export default async function PreviewHome({ params }: Params) {
  const locale = await getLocale();
  const { slug } = await params;
  const business = await getBusinessBySlug(slug);
  if (!business || business.is_suspended) return <Unavailable business={business} locale={locale} />;
  const { categories, products } = await getCatalog(business.id);
  return <Storefront business={business} categories={categories} products={products} home={`/s/${slug}`} locale={locale} />;
}
