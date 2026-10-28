// Imports products (with photos) from content/products/products.json into a business.
// Photos are uploaded to the same storage folder the Admin uses, so the owner can
// edit, replace or delete these products normally afterwards.
//
// Usage: npm run import-products                       (business = DEFAULT_BUSINESS_SLUG)
//        npm run import-products -- --refresh-images    (also replace photos of existing products)
// Safe to re-run: a product whose slug already exists is skipped (unless refreshing its photo).
import { createClient } from "@supabase/supabase-js";
import fs from "node:fs";
import path from "node:path";

const { NEXT_PUBLIC_SUPABASE_URL: url, SUPABASE_SERVICE_ROLE_KEY: key, DEFAULT_BUSINESS_SLUG: slug = "shababik" } = process.env;
if (!url || !key) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}
const dir = path.resolve("content/products");
const items = JSON.parse(fs.readFileSync(path.join(dir, "products.json"), "utf8"));
const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

const { data: business } = await db.from("businesses").select("id").eq("slug", slug).single();
if (!business) throw new Error(`Business "${slug}" not found`);
const { data: categories } = await db.from("categories").select("id, slug").eq("business_id", business.id);
const catId = new Map(categories.map((c) => [c.slug, c.id]));

const slugify = (s) => s.toLowerCase().replace(/&/g, " and ").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
const types = { ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".webp": "image/webp" };
const refreshImages = process.argv.includes("--refresh-images");
const marker = "/storage/v1/object/public/product-images/";

async function uploadPhoto(file, productSlug) {
  const ext = path.extname(file).toLowerCase();
  if (!types[ext]) throw new Error(`Unsupported image type: ${file}`);
  const objectPath = `${business.id}/${productSlug}-${Date.now()}${ext}`;
  const { error } = await db.storage
    .from("product-images")
    .upload(objectPath, fs.readFileSync(file), { contentType: types[ext], cacheControl: "31536000" });
  if (error) throw error;
  return db.storage.from("product-images").getPublicUrl(objectPath).data.publicUrl;
}

for (const item of items) {
  const productSlug = slugify(item.name);
  const { data: exists } = await db
    .from("products").select("id, image_url").eq("business_id", business.id).eq("slug", productSlug).maybeSingle();
  if (exists) {
    if (refreshImages && item.image) {
      const imageUrl = await uploadPhoto(path.join(dir, item.image), productSlug);
      await db.from("products").update({ image_url: imageUrl }).eq("id", exists.id);
      const old = exists.image_url?.split(marker)[1];
      if (old) await db.storage.from("product-images").remove([decodeURIComponent(old)]);
      console.log(`↻ photo replaced: ${item.name}`);
    } else {
      console.log(`- skipped (already exists): ${item.name}`);
    }
    continue;
  }
  const categoryId = catId.get(item.category);
  if (!categoryId) throw new Error(`Category "${item.category}" not found for ${item.name}`);

  const imageUrl = item.image ? await uploadPhoto(path.join(dir, item.image), productSlug) : null;

  const { error } = await db.from("products").insert({
    business_id: business.id,
    category_id: categoryId,
    name: item.name,
    slug: productSlug,
    short_description: item.short_description ?? null,
    name_ar: item.name_ar ?? null,
    short_description_ar: item.short_description_ar ?? null,
    options: item.options ?? null,
    options_ar: item.options_ar ?? null,
    price: item.ask_for_price ? null : item.price ?? null,
    ask_for_price: !!item.ask_for_price || item.price == null,
    image_url: imageUrl,
    is_available: item.is_available ?? true,
    is_featured: !!item.is_featured,
    display_order: 0, // newest real products first
  });
  if (error) throw error;
  console.log(`✓ ${item.name}`);
}
console.log("Done.");
