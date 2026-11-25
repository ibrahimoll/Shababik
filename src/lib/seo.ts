import type { Metadata } from "next";
import type { Locale } from "./i18n";
import type { PublicBusiness } from "./types";

export function siteMetadata(b: PublicBusiness | null, locale: Locale = "en", path = "/"): Metadata {
  if (!b || b.is_suspended) return { title: b?.name ?? "Website not found", robots: { index: false } };
  const place = !b.location ? "Lebanon" : /lebanon/i.test(b.location) ? b.location : `${b.location}, Lebanon`;
  const ar = locale === "ar";
  const arName = b.arabic_name || b.name;
  const title = ar ? `${arName} | هدايا وأشغال يدوية في لبنان` : `${b.name} | Handmade Gifts & Crafts Lebanon`;
  const description = ar
    ? `اكتشفوا هدايا وإكسسوارات وشموعاً وصابوناً ورزيناً وجفصيناً وقطعاً مخصّصة مصنوعة يدوياً من ${arName} في ${b.location_ar || "لبنان"}.`
    : `Discover handmade gifts, accessories, candles, pottery, wood, resin and personalized creations by ${b.name} in ${place}.`;
  const canonical = b.domain ? `https://${b.domain}${path === "/" ? "" : path}` : undefined;
  // link preview (WhatsApp, Facebook…): absolute on the shop's own domain, else relative to metadataBase
  const image = { url: b.domain ? `https://${b.domain}/og.jpg` : "/og.jpg", width: 1200, height: 630, alt: b.name };
  return {
    title,
    description,
    alternates: canonical ? { canonical } : undefined,
    openGraph: { title, description, type: "website", siteName: b.name, url: canonical, locale: ar ? "ar_LB" : "en_US", images: [image] },
    twitter: { card: "summary_large_image", title, description, images: [image.url] },
  };
}
