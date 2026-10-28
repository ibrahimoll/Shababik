import type { Metadata } from "next";
import { InfoPage } from "@/components/site/InfoPage";
import { Unavailable } from "@/components/site/Unavailable";
import { dict } from "@/lib/i18n";
import { getLocale } from "@/lib/locale";
import { getBusinessForRequest, getCatalog } from "@/lib/site";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const [business, locale] = await Promise.all([getBusinessForRequest(), getLocale()]);
  return { title: `${dict(locale).info.title} | ${business?.name ?? ""}` };
}

export default async function Info() {
  const locale = await getLocale();
  const business = await getBusinessForRequest();
  if (!business || business.is_suspended) return <Unavailable business={business} locale={locale} />;
  const { categories, products } = await getCatalog(business.id);
  return <InfoPage business={business} categories={categories} products={products} home="/" locale={locale} />;
}
