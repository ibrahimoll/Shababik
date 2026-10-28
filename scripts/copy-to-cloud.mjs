// Copies the Shababik shop (business info, collections, products + photos) from the
// local Supabase to the online one. Accounts are NOT copied (run bootstrap for those).
// Usage:  node --env-file=.env.local scripts/copy-to-cloud.mjs
// Reads the online keys from .env.cloud. Replaces the online shop's collections and products.
import { createClient } from "@supabase/supabase-js";
import fs from "node:fs";

const cloudEnv = Object.fromEntries(
  fs.readFileSync(".env.cloud", "utf8").split(/\r?\n/)
    .filter((l) => /^[A-Z_]+=/.test(l))
    .map((l) => [l.slice(0, l.indexOf("=")), l.slice(l.indexOf("=") + 1).trim()]),
);
const opts = { auth: { persistSession: false, autoRefreshToken: false } };
const local = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, opts);
const cloud = createClient(cloudEnv.NEXT_PUBLIC_SUPABASE_URL, cloudEnv.SUPABASE_SERVICE_ROLE_KEY, opts);
const slug = process.env.DEFAULT_BUSINESS_SLUG || "shababik";
const BUCKET = "product-images";
const marker = `/storage/v1/object/public/${BUCKET}/`;

const must = ({ data, error }, what) => { if (error) throw new Error(`${what}: ${error.message}`); return data; };

/** Copies a local storage photo online and returns its new address. Other values pass through. */
async function moveUrl(url) {
  if (typeof url !== "string" || !url.includes(marker)) return url;
  const objectPath = decodeURIComponent(url.split(marker)[1]);
  const blob = must(await local.storage.from(BUCKET).download(objectPath), `download ${objectPath}`);
  must(await cloud.storage.from(BUCKET).upload(objectPath, blob, { contentType: blob.type, upsert: true }), `upload ${objectPath}`);
  return cloud.storage.from(BUCKET).getPublicUrl(objectPath).data.publicUrl;
}

const biz = must(await local.from("businesses").select("*").eq("slug", slug).single(), "local business");
const cloudBiz = must(await cloud.from("businesses").select("id").eq("slug", slug).maybeSingle(), "online business");
if (!cloudBiz || cloudBiz.id !== biz.id) throw new Error("Online database has no matching Shababik business — push migrations + seed first.");

// 1. business info
const { id, created_at, ...bizFields } = biz;
for (const k of Object.keys(bizFields)) bizFields[k] = await moveUrl(bizFields[k]);
must(await cloud.from("businesses").update(bizFields).eq("id", id), "update business");
console.log("✓ business info");

// 2. replace products and collections
must(await cloud.from("products").delete().eq("business_id", id), "clear products");
const cats = must(await local.from("categories").select("*").eq("business_id", id), "local categories");
for (const c of cats) c.image_url = await moveUrl(c.image_url);
must(await cloud.from("categories").delete().eq("business_id", id).not("id", "in", `(${cats.map((c) => c.id).join(",")})`), "remove extra categories");
must(await cloud.from("categories").upsert(cats), "upsert categories");
console.log(`✓ ${cats.length} collections`);

const products = must(await local.from("products").select("*").eq("business_id", id), "local products");
for (const p of products) {
  p.image_url = await moveUrl(p.image_url);
  process.stdout.write(".");
}
must(await cloud.from("products").insert(products), "insert products");
console.log(`\n✓ ${products.length} products with photos`);
