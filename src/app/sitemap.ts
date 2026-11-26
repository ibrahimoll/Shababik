import type { MetadataRoute } from "next";
import { getBusinessForRequest, getCatalog } from "@/lib/site";

export const dynamic = "force-dynamic";

/** Pages Google should know about (shababik.net/sitemap.xml). */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const b = await getBusinessForRequest();
  if (!b || b.is_suspended || !b.domain) return [];
  const base = `https://${b.domain}`;
  const { categories } = await getCatalog(b.id);
  return [
    { url: base, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/products`, changeFrequency: "weekly", priority: 0.9 },
    ...categories.map((c) => ({ url: `${base}/products?category=${encodeURIComponent(c.slug)}`, changeFrequency: "weekly" as const, priority: 0.7 })),
    { url: `${base}/info`, changeFrequency: "monthly", priority: 0.4 },
  ];
}
