import { cache } from "react";
import { headers } from "next/headers";
import { createPublicClient } from "./supabase/public";
import type { Category, Product, PublicBusiness } from "./types";

/** Resolve which business to show: by custom domain, otherwise the default slug. */
export const getBusinessForRequest = cache(async (): Promise<PublicBusiness | null> => {
  const host = ((await headers()).get("host") ?? "").split(":")[0].toLowerCase().replace(/^www\./, "");
  const supabase = createPublicClient();
  if (host) {
    const { data } = await supabase
      .from("public_businesses")
      .select("*")
      .in("domain", [host, `www.${host}`])
      .limit(1)
      .maybeSingle<PublicBusiness>();
    if (data) return data;
  }
  const slug = process.env.DEFAULT_BUSINESS_SLUG;
  return slug ? getBusinessBySlug(slug) : null;
});

export const getBusinessBySlug = cache(async (slug: string): Promise<PublicBusiness | null> => {
  const { data } = await createPublicClient()
    .from("public_businesses")
    .select("*")
    .eq("slug", slug)
    .maybeSingle<PublicBusiness>();
  return data;
});

export const getCatalog = cache(async (businessId: string) => {
  const supabase = createPublicClient();
  const [cats, prods] = await Promise.all([
    supabase.from("categories").select("*").eq("business_id", businessId).order("display_order").order("name"),
    supabase
      .from("products")
      .select("*")
      .eq("business_id", businessId)
      .order("display_order")
      .order("created_at", { ascending: false }),
  ]);
  return {
    categories: (cats.data ?? []) as Category[],
    products: (prods.data ?? []) as Product[],
  };
});

/**
 * Order of the homepage "All" view, as set on Admin → Arrange (products arrive sorted by their
 * category position, then newest). Arranged products (home_order) come first; the rest follow,
 * taking turns across categories: each category's #1, then each one's #2, and so on.
 */
export function homeOrder(products: Product[], categories: Category[]): Product[] {
  const lists = categories.map((c) => products.filter((p) => p.is_available && p.category_id === c.id));
  const turns: Product[] = [];
  const longest = Math.max(0, ...lists.map((l) => l.length));
  for (let round = 0; round < longest; round++) for (const l of lists) if (l[round]) turns.push(l[round]);
  // stable sort: arranged first by position, unarranged keep their turn order
  return turns.sort((a, b) => (a.home_order ?? Infinity) - (b.home_order ?? Infinity));
}

/**
 * Homepage "Featured Creations": `limit` products for "All" (in homeOrder) and the first `limit`
 * available products of each category (in its Arrange order).
 */
export function showcase(products: Product[], categories: Category[], limit = 10) {
  const all = homeOrder(products, categories).slice(0, limit);
  const byCategory = categories
    .map((c) => ({ id: c.id, items: products.filter((p) => p.is_available && p.category_id === c.id).slice(0, limit) }))
    .filter((c) => c.items.length > 0);
  return { all, byCategory };
}
