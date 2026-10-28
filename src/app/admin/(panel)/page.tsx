import Link from "next/link";
import { Icon } from "@/components/Icon";
import { Thumb } from "@/components/panel/Thumb";
import { Flash } from "@/components/ui/Flash";
import { requireAdmin } from "@/lib/auth";
import { formatPrice, siteUrl } from "@/lib/utils";
import type { Product } from "@/lib/types";

export default async function AdminDashboard({ searchParams }: { searchParams: Promise<{ msg?: string }> }) {
  const { msg } = await searchParams;
  const { supabase, business } = await requireAdmin();
  const [{ data: products }, { count: categoryCount }, { data: biz }] = await Promise.all([
    supabase.from("products").select("*").eq("business_id", business.id).order("created_at", { ascending: false }),
    supabase.from("categories").select("id", { count: "exact", head: true }).eq("business_id", business.id),
    supabase.from("businesses").select("domain, slug").eq("id", business.id).single(),
  ]);
  const list = (products ?? []) as Product[];

  const stats = [
    { label: "Total Products", value: list.length, icon: "box" as const },
    { label: "Featured Products", value: list.filter((p) => p.is_featured).length, icon: "star" as const },
    { label: "Categories", value: categoryCount ?? 0, icon: "tag" as const },
    { label: "Unavailable Products", value: list.filter((p) => !p.is_available).length, icon: "eyeOff" as const },
  ];

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Dashboard</h1>
          <p className="muted">Here&apos;s an overview of your website.</p>
        </div>
        {biz && (
          <a href={siteUrl(biz)} target="_blank" rel="noopener noreferrer" className="pbtn pbtn-ghost">
            <Icon name="external" size={18} /> View website
          </a>
        )}
      </div>

      <Flash code={msg} />

      <Link href="/admin/products/new" className="hero-cta">
        <span className="hero-cta-plus">
          <Icon name="plus" size={26} />
        </span>
        <span>
          <b>Add Product</b>
          <small>Upload a photo, add a name and price — it appears on your website right away.</small>
        </span>
      </Link>

      <div className="stats">
        {stats.map((s) => (
          <div key={s.label} className="stat">
            <Icon name={s.icon} size={20} />
            <b>{s.value}</b>
            <span>{s.label}</span>
          </div>
        ))}
      </div>

      <section className="card">
        <div className="card-head">
          <h2>Recently Added Products</h2>
          <Link href="/admin/products" className="text-link">
            See all
          </Link>
        </div>
        {list.length === 0 ? (
          <p className="muted">No products yet.</p>
        ) : (
          <ul className="mini-list">
            {list.slice(0, 5).map((p) => (
              <li key={p.id}>
                <Thumb src={p.image_url} />
                <span className="mini-name">{p.name}</span>
                <span className="muted small">{formatPrice(p.price, p.ask_for_price)}</span>
                <Link href={`/admin/products/${p.id}/edit`} className="pbtn pbtn-ghost pbtn-sm">
                  Edit
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
