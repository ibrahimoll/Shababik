import Link from "next/link";
import { Icon } from "@/components/Icon";
import { Thumb } from "@/components/panel/Thumb";
import { ConfirmAction } from "@/components/ui/ConfirmAction";
import { Flash } from "@/components/ui/Flash";
import { requireAdmin } from "@/lib/auth";
import { formatPrice } from "@/lib/utils";
import type { Category, Product } from "@/lib/types";
import { deleteProduct } from "../../actions";

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ msg?: string; category?: string }>;
}) {
  const { supabase, business } = await requireAdmin();
  const { msg, category } = await searchParams;
  const [{ data: products }, { data: categories }] = await Promise.all([
    supabase.from("products").select("*").eq("business_id", business.id).order("created_at", { ascending: false }),
    supabase.from("categories").select("*").eq("business_id", business.id).order("display_order").order("name"),
  ]);
  const all = (products ?? []) as Product[];
  const cats = (categories ?? []) as Category[];
  const catName = new Map(cats.map((c) => [c.id, c.name]));
  const counts = new Map<string, number>();
  all.forEach((p) => counts.set(p.category_id, (counts.get(p.category_id) ?? 0) + 1));
  // only a category of this business can be selected
  const current = cats.find((c) => c.id === category) ?? null;
  const list = current ? all.filter((p) => p.category_id === current.id) : all;
  const newHref = current ? `/admin/products/new?category=${current.id}` : "/admin/products/new";

  return (
    <>
      <div className="page-head">
        <div>
          {current && (
            <Link href="/admin/categories" className="back-link">
              ← Categories
            </Link>
          )}
          <h1>{current ? current.name : "Products"}</h1>
          <p className="muted">
            {list.length} {list.length === 1 ? "product" : "products"}
            {current ? " in this category" : " on your website"}
          </p>
        </div>
        <Link href={newHref} className="pbtn pbtn-primary pbtn-lg">
          <Icon name="plus" size={20} /> Add Product
        </Link>
      </div>
      <Flash code={msg} />

      {cats.length > 0 && all.length > 0 && (
        <nav className="cat-chips" aria-label="Filter by category">
          <Link href="/admin/products" className="cat-chip" aria-current={current ? undefined : "page"}>
            All <span>{all.length}</span>
          </Link>
          {cats.map((c) => (
            <Link
              key={c.id}
              href={`/admin/products?category=${c.id}`}
              className="cat-chip"
              aria-current={current?.id === c.id ? "page" : undefined}
            >
              {c.name} <span>{counts.get(c.id) ?? 0}</span>
            </Link>
          ))}
        </nav>
      )}

      {list.length === 0 ? (
        <div className="empty-state">
          <Icon name="box" size={34} />
          <p>{current ? `No products in ${current.name} yet.` : "No products yet."}</p>
          <Link href={newHref} className="pbtn pbtn-primary pbtn-lg">
            <Icon name="plus" size={20} /> {current ? `Add a Product to ${current.name}` : "Add Your First Product"}
          </Link>
        </div>
      ) : (
        <ul className="product-rows">
          {list.map((p) => (
            <li key={p.id} className="product-row">
              <Thumb src={p.image_url} />
              <div className="row-main">
                <b>{p.name}</b>
                <span className="muted small">
                  {catName.get(p.category_id) ?? "—"} · {formatPrice(p.price, p.ask_for_price)}
                </span>
                <span className="pills">
                  {p.is_featured && <span className="pill pill-accent">Featured</span>}
                  {!p.is_available && <span className="pill pill-muted">Unavailable</span>}
                </span>
              </div>
              <div className="row-actions">
                <Link href={`/admin/products/${p.id}/edit`} className="pbtn pbtn-ghost" aria-label={`Edit ${p.name}`}>
                  <Icon name="edit" size={18} /> <span className="hide-xs">Edit</span>
                </Link>
                <ConfirmAction
                  action={deleteProduct}
                  fields={{ id: p.id }}
                  trigger={<Icon name="trash" size={18} />}
                  triggerLabel={`Delete ${p.name}`}
                  triggerClassName="pbtn pbtn-ghost pbtn-danger-text"
                  title="Are you sure you want to delete this product?"
                  message={`“${p.name}” will be removed from your website.`}
                  confirmLabel="Delete Product"
                  pendingText="Deleting…"
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
