import type { Metadata } from "next";
import { InfoPage } from "@/components/site/InfoPage";
import { Unavailable } from "@/components/site/Unavailable";
import { dict } from "@/lib/i18n";
import { getLocale } from "@/lib/locale";
import { getBusinessBySlug, getCatalog } from "@/lib/site";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const [business, locale] = await Promise.all([getBusinessBySlug((await params).slug), getLocale()]);
  return { title: `${dict(locale).info.title} | ${business?.name ?? ""}`, robots: { index: false, follow: false } };
}

export default async function PreviewInfo({ params }: Params) {
  const { slug } = await params;
  const locale = await getLocale();
  const business = await getBusinessBySlug(slug);
  if (!business || business.is_suspended) return <Unavailable business={business} locale={locale} />;
  const { categories, products } = await getCatalog(business.id);
  return <InfoPage business={business} categories={categories} products={products} home={`/s/${slug}`} locale={locale} />;
}
