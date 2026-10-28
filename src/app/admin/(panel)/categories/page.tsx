import Link from "next/link";
import { Icon } from "@/components/Icon";
import { ConfirmAction } from "@/components/ui/ConfirmAction";
import { Flash } from "@/components/ui/Flash";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { requireAdmin } from "@/lib/auth";
import type { Category } from "@/lib/types";
import { createCategory, deleteCategory, renameCategory } from "../../actions";

export default async function CategoriesPage({ searchParams }: { searchParams: Promise<{ msg?: string }> }) {
  const { supabase, business } = await requireAdmin();
  const { msg } = await searchParams;
  const [{ data: cats }, { data: prods }] = await Promise.all([
    supabase.from("categories").select("*").eq("business_id", business.id).order("display_order").order("name"),
    supabase.from("products").select("category_id").eq("business_id", business.id),
  ]);
  const categories = (cats ?? []) as Category[];
  const counts = new Map<string, number>();
  (prods ?? []).forEach((p) => counts.set(p.category_id, (counts.get(p.category_id) ?? 0) + 1));

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Categories</h1>
          <p className="muted">Group your products into collections on the website.</p>
        </div>
      </div>
      <Flash code={msg} />

      <form action={createCategory} className="card inline-form">
        <label className="field grow">
          <span>{categories.length ? "New collection (English)" : "Create Your First Category"}</span>
          <input name="name" required maxLength={60} placeholder="e.g. Wool" />
        </label>
        <label className="field grow">
          <span>Arabic name (optional)</span>
          <input name="name_ar" maxLength={60} dir="rtl" lang="ar" placeholder="شباك الصوف" />
        </label>
        <SubmitButton pendingText="Adding…">
          <Icon name="plus" size={18} /> Add Category
        </SubmitButton>
      </form>

      {categories.length === 0 ? (
        <div className="empty-state">
          <Icon name="tag" size={34} />
          <p>No categories yet. Create your first category above — for example “Gifts” or “Candles”.</p>
        </div>
      ) : (
        <ul className="cat-rows">
          {categories.map((c) => {
            const n = counts.get(c.id) ?? 0;
            return (
              <li key={c.id} className="cat-row">
                <form action={renameCategory} className="cat-rename">
                  <input type="hidden" name="id" value={c.id} />
                  <label className="sr-only" htmlFor={`cat-${c.id}`}>Name in English</label>
                  <input id={`cat-${c.id}`} name="name" defaultValue={c.name} required maxLength={60} />
                  <label className="sr-only" htmlFor={`cat-ar-${c.id}`}>Name in Arabic</label>
                  <input
                    id={`cat-ar-${c.id}`}
                    name="name_ar"
                    defaultValue={c.name_ar ?? ""}
                    maxLength={60}
                    dir="rtl"
                    lang="ar"
                    placeholder="بالعربي"
                  />
                  <SubmitButton className="pbtn pbtn-ghost" pendingText="Saving…">
                    Save
                  </SubmitButton>
                </form>
                <Link href={`/admin/products?category=${c.id}`} className="text-link cat-count">
                  {n} {n === 1 ? "product" : "products"} →
                </Link>
                {n ? (
                  <button
                    type="button"
                    className="pbtn pbtn-ghost"
                    disabled
                    title="Move its products to another category before deleting"
                    aria-label={`${c.name} can't be deleted while it has products. Move them to another category first.`}
                  >
                    <Icon name="trash" size={18} />
                  </button>
                ) : (
                  <ConfirmAction
                    action={deleteCategory}
                    fields={{ id: c.id }}
                    trigger={<Icon name="trash" size={18} />}
                    triggerLabel={`Delete ${c.name}`}
                    triggerClassName="pbtn pbtn-ghost pbtn-danger-text"
                    title={`Delete “${c.name}”?`}
                    message="This category will be removed from your website."
                    confirmLabel="Delete Category"
                    pendingText="Deleting…"
                  />
                )}
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
