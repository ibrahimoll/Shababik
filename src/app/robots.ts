import type { MetadataRoute } from "next";

import { getBusinessForRequest } from "@/lib/site";

export const dynamic = "force-dynamic";

export default async function robots(): Promise<MetadataRoute.Robots> {
  const b = await getBusinessForRequest();
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/admin", "/s/"] }],
    sitemap: b?.domain ? `https://${b.domain}/sitemap.xml` : undefined,
  };
}
