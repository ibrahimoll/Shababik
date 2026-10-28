import { Catalog } from "@/components/site/Catalog";
import { Unavailable } from "@/components/site/Unavailable";
import { getBusinessBySlug, getCatalog } from "@/lib/site";
import { siteMetadata } from "@/lib/seo";
import { getLocale } from "@/lib/locale";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<{ category?: string }> };

export async function generateMetadata({ params }: Props) {
  const meta = siteMetadata(await getBusinessBySlug((await params).slug), await getLocale(), "/products");
  return { ...meta, robots: { index: false, follow: false } };
}

export default async function PreviewProducts({ params, searchParams }: Props) {
  const locale = await getLocale();
  const { slug } = await params;
  const business = await getBusinessBySlug(slug);
  if (!business || business.is_suspended) return <Unavailable business={business} locale={locale} />;
  const { categories, products } = await getCatalog(business.id);
  const { category } = await searchParams;
  return <Catalog business={business} categories={categories} products={products} home={`/s/${slug}`} activeSlug={category} locale={locale} />;
}
