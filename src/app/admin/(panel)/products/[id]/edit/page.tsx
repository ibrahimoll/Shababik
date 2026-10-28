import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductForm } from "@/components/panel/ProductForm";
import { requireAdmin } from "@/lib/auth";
import type { Category, Product } from "@/lib/types";

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase, business } = await requireAdmin();
  const [{ data: product }, { data: categories }] = await Promise.all([
    // business_id filter + RLS: another business's product id is simply "not found"
    supabase.from("products").select("*").eq("id", id).eq("business_id", business.id).maybeSingle(),
    supabase.from("categories").select("*").eq("business_id", business.id).order("display_order").order("name"),
  ]);
  if (!product) notFound();
  return (
    <>
      <div className="page-head">
        <div>
          <Link href="/admin/products" className="back-link">
            ← Products
          </Link>
          <h1>Edit Product</h1>
        </div>
      </div>
      <ProductForm businessId={business.id} categories={(categories ?? []) as Category[]} product={product as Product} />
    </>
  );
}
