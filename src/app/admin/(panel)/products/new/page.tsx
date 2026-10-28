import Link from "next/link";
import { ProductForm } from "@/components/panel/ProductForm";
import { requireAdmin } from "@/lib/auth";
import type { Category } from "@/lib/types";

export default async function NewProductPage({ searchParams }: { searchParams: Promise<{ category?: string }> }) {
  const { supabase, business } = await requireAdmin();
  const { category } = await searchParams;
  const { data } = await supabase
    .from("categories")
    .select("*")
    .eq("business_id", business.id)
    .order("display_order")
    .order("name");
  const categories = (data ?? []) as Category[];
  return (
    <>
      <div className="page-head">
        <div>
          <Link href="/admin/products" className="back-link">
            ← Products
          </Link>
          <h1>Add Product</h1>
        </div>
      </div>
      <ProductForm
        businessId={business.id}
        categories={categories}
        defaultCategoryId={categories.some((c) => c.id === category) ? category : undefined}
      />
    </>
  );
}
