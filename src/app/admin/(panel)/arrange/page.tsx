import Link from "next/link";
import { Icon } from "@/components/Icon";
import { SortList } from "@/components/panel/SortList";
import { Flash } from "@/components/ui/Flash";
import { requireAdmin } from "@/lib/auth";
import { homeOrder } from "@/lib/site";
import { formatPrice } from "@/lib/utils";
import type { Category, Product } from "@/lib/types";
import { saveCategoryOrder, saveHomeOrder, saveProductOrder } from "../../actions";

export default async function ArrangePage({
  searchParams,
}: {
  searchParams: Promise<{ msg?: string; category?: string }>;
}) {
  const { supabase, business } = await requireAdmin();
  const { msg, category } = await searchParams;
  // same order as the website: position first, then newest
  const [{ data: cats }, { data: prods }] = await Promise.all([
    supabase.from("categories").select("*").eq("business_id", business.id).order("display_order").order("name"),
    supabase
      .from("products")
      .select("*")
      .eq("business_id", business.id)
      .order("display_order")
      .order("created_at", { ascending: false }),
  ]);
  const categories = (cats ?? []) as Category[];
  const products = (prods ?? []) as Product[];
  const count = (id: string) => products.filter((p) => p.category_id === id).length;
  const withProducts = categories.filter((c) => count(c.id) > 0);
  // "All" (the homepage's first view) is the default
  const isAll = !category || category === "all" || !withProducts.some((c) => c.id === category);
  const current = isAll ? null : withProducts.find((c) => c.id === category)!;
  const inCurrent = current ? products.filter((p) => p.category_id === current.id) : [];
  const allList = homeOrder(products, categories);
  const catName = new Map(categories.map((c) => [c.id, c.name]));

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Arrange</h1>
          <p className="muted">Choose what comes first on your website.</p>
        </div>
      </div>
      <Flash code={msg} />

      {categories.length === 0 ? (
        <div className="empty-state">
          <Icon name="tag" size={34} />
          <p>Add categories and products first, then arrange them here.</p>
          <Link href="/admin/categories" className="pbtn pbtn-primary pbtn-lg">Go to Categories</Link>
        </div>
      ) : (
        <>
          <section className="card arrange-card" aria-labelledby="arrange-products">
            <div>
              <h2 id="arrange-products">Product order</h2>
              <p className="muted small">
                “Featured Creations” on the homepage shows 10 products under “All” and 10 under each category button.
                Pick a list and put your favourites on top.
              </p>
            </div>
            {withProducts.length > 0 && (
              <nav className="cat-chips" aria-label="Choose a list">
                <Link href="/admin/arrange?category=all" className="cat-chip" aria-current={isAll ? "page" : undefined}>
                  All <span>{allList.length}</span>
                </Link>
                {withProducts.map((c) => (
                  <Link
                    key={c.id}
                    href={`/admin/arrange?category=${c.id}`}
                    className="cat-chip"
                    aria-current={current?.id === c.id ? "page" : undefined}
                  >
                    {c.name} <span>{count(c.id)}</span>
                  </Link>
                ))}
              </nav>
            )}
            {isAll ? (
              allList.length ? (
                <SortList
                  key={`all:${allList.map((p) => p.id).join(",")}`}
                  action={saveHomeOrder}
                  showThumbs
                  cutoff={10}
                  cutoffLabel="Only the first 10 show under “All” on the homepage"
                  items={allList.map((p) => ({
                    id: p.id,
                    label: p.name,
                    sub: `${catName.get(p.category_id) ?? ""} · ${formatPrice(p.price, p.ask_for_price)}`,
                    image: p.image_url,
                  }))}
                />
              ) : (
                <p className="muted">No available products yet.</p>
              )
            ) : current ? (
              <SortList
                // remount after saving so the list starts from the saved order
                key={`${current.id}:${inCurrent.map((p) => p.id).join(",")}`}
                action={saveProductOrder}
                fields={{ category_id: current.id }}
                showThumbs
                cutoff={10}
                cutoffLabel={`Only the first 10 show under “${current.name}” on the homepage`}
                items={inCurrent.map((p) => ({
                  id: p.id,
                  label: p.name,
                  sub: `${formatPrice(p.price, p.ask_for_price)}${p.is_available ? "" : " · Unavailable (hidden on homepage)"}`,
                  image: p.image_url,
                }))}
              />
            ) : (
              <p className="muted">No products yet.</p>
            )}
          </section>

          <section className="card arrange-card" aria-labelledby="arrange-categories">
            <div>
              <h2 id="arrange-categories">Category order</h2>
              <p className="muted small">
                Sets the order of the category buttons in “Featured Creations” and of the collections on your website.
              </p>
            </div>
            <SortList
              key={categories.map((c) => c.id).join(",")}
              action={saveCategoryOrder}
              items={categories.map((c) => ({
                id: c.id,
                label: c.name,
                sub: `${count(c.id)} ${count(c.id) === 1 ? "product" : "products"}`,
              }))}
            />
          </section>
        </>
      )}
    </>
  );
}
