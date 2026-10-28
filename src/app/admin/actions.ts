"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { LOCKED_MESSAGE, audit, clientIp, failureDelay, isLockedOut, recordAttempt } from "@/lib/security";
import { createClient } from "@/lib/supabase/server";
import { parseOptions, slugify } from "@/lib/utils";
import { saBaseFromRequest } from "@/lib/sa-link";
import { isSaBase, superAdminEmail } from "@/lib/sa-path";

export type FormState = { error?: string | null };

const str = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();
const opt = (fd: FormData, k: string) => str(fd, k) || null;

type AdminCtx = Awaited<ReturnType<typeof requireAdmin>>;
const actorOf = (c: AdminCtx) => ({ id: c.user.id, email: c.profile.email, role: c.profile.role });

function refreshWebsite() {
  // Public pages are dynamic, but clear any cached render so changes show instantly.
  revalidatePath("/", "layout");
}

// ---------------------------------------------------------------- auth

export async function adminLogin(_: FormState, fd: FormData): Promise<FormState> {
  const email = str(fd, "email");
  const password = String(fd.get("password") ?? "");
  if (!email || !password) return { error: "Please enter your email and password." };

  const ip = await clientIp();
  if (await isLockedOut("password", email, ip)) return { error: LOCKED_MESSAGE };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error || !data.user) {
    await recordAttempt("password", email, ip, false);
    await audit({ action: "login.failed", actor: { email }, details: { area: "admin" } });
    await failureDelay();
    return { error: "Invalid login details." };
  }
  await recordAttempt("password", email, ip, true);

  const { data: profile } = await supabase
    .from("profiles").select("role, is_active, business_id").eq("auth_user_id", data.user.id).maybeSingle();

  if (!profile || !profile.is_active) {
    await supabase.auth.signOut();
    return { error: "This account has been disabled. Please contact your website provider." };
  }
  if (profile.role === "super_admin") {
    // only the one configured Super Admin email gets in — and is sent to the hidden console
    if (email.toLowerCase() !== superAdminEmail()) {
      await supabase.auth.signOut();
      await failureDelay();
      return { error: "Invalid login details." };
    }
    await audit({ action: "login", actor: { id: data.user.id, email, role: "super_admin" }, details: { area: "admin-login" } });
    // only a hash of the console address is configured: use the address saved on the account
    // (when the console was last opened) or the one this browser remembers — both checked against the hash
    const saved = data.user.app_metadata?.console_path;
    const base = (typeof saved === "string" && (await isSaBase(saved)) ? saved : null) ?? (await saBaseFromRequest());
    if (!base) return { error: "Signed in. Open your Super Admin address to continue." };
    redirect(base);
  }

  const { data: business } = await supabase
    .from("businesses").select("status").eq("id", profile.business_id).maybeSingle();
  if (!business || business.status === "suspended") {
    await supabase.auth.signOut();
    return { error: "This website is currently suspended. Please contact your website provider." };
  }
  await audit({ action: "login", businessId: profile.business_id, actor: { id: data.user.id, email, role: "admin" } });
  redirect("/admin");
}

export async function adminLogout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/admin/login");
}

// ---------------------------------------------------------------- products

/** Only accept images stored in this business's own folder of our bucket. */
function validImageUrl(url: string | null, businessId: string): boolean {
  if (!url) return true;
  const prefix = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/product-images/${businessId}/`;
  return url.startsWith(prefix) && !url.slice(prefix.length).includes("..");
}

function storagePath(url: string | null): string | null {
  if (!url) return null;
  const marker = "/storage/v1/object/public/product-images/";
  const i = url.indexOf(marker);
  return i === -1 ? null : decodeURIComponent(url.slice(i + marker.length));
}

export async function saveProduct(_: FormState, fd: FormData): Promise<FormState> {
  const ctx = await requireAdmin();
  const { supabase, business } = ctx;
  const id = opt(fd, "id");
  const name = str(fd, "name");
  const categoryId = str(fd, "category_id");
  const imageUrl = opt(fd, "image_url");
  const askForPrice = fd.get("ask_for_price") === "on";
  const priceRaw = str(fd, "price");
  const options = opt(fd, "options")?.slice(0, 600) ?? null;
  // with priced options and no main price, the lowest option price is used ("From $…")
  const optionPrices = parseOptions(options).flatMap((o) => (o.price === null ? [] : [o.price]));
  const price = priceRaw === "" ? (optionPrices.length ? Math.min(...optionPrices) : null) : Number(priceRaw);

  if (!name) return { error: "Please enter a product name." };
  if (name.length > 120) return { error: "Product name is too long." };
  if (!categoryId) return { error: "Please choose a category." };
  if (!id && !imageUrl) return { error: "Please add a product photo." };
  if (!askForPrice && (price === null || !Number.isFinite(price) || price < 0)) {
    return { error: "Please enter a price, or tick “Ask for Price”." };
  }
  if (!validImageUrl(imageUrl, business.id)) return { error: "Unable to upload image. Please try again." };

  // category must belong to this business
  const { data: cat } = await supabase
    .from("categories").select("id").eq("id", categoryId).eq("business_id", business.id).maybeSingle();
  if (!cat) return { error: "Please choose a category." };

  const row = {
    name,
    category_id: categoryId,
    short_description: opt(fd, "short_description")?.slice(0, 400) ?? null,
    name_ar: opt(fd, "name_ar")?.slice(0, 120) ?? null,
    options,
    options_ar: opt(fd, "options_ar")?.slice(0, 600) ?? null,
    short_description_ar: opt(fd, "short_description_ar")?.slice(0, 400) ?? null,
    price: askForPrice ? null : price,
    ask_for_price: askForPrice,
    image_url: imageUrl,
    is_available: fd.get("is_available") === "yes",
    is_featured: fd.get("is_featured") === "on",
  };

  if (id) {
    const { data: existing } = await supabase
      .from("products").select("id, image_url").eq("id", id).eq("business_id", business.id).maybeSingle();
    if (!existing) return { error: "This product could not be found." };
    const { error } = await supabase.from("products").update(row).eq("id", id).eq("business_id", business.id);
    if (error) return { error: "Unable to save the product. Please try again." };
    // tidy up a replaced / removed photo
    if (existing.image_url && existing.image_url !== imageUrl) {
      const path = storagePath(existing.image_url);
      if (path) await supabase.storage.from("product-images").remove([path]);
    }
    await audit({ action: "product.updated", businessId: business.id, actor: actorOf(ctx), target: name });
  } else {
    const base = slugify(name) || "product";
    const { data: clash } = await supabase
      .from("products").select("slug").eq("business_id", business.id).like("slug", `${base}%`);
    const taken = new Set((clash ?? []).map((r) => r.slug));
    let slug = base;
    for (let n = 2; taken.has(slug); n++) slug = `${base}-${n}`;

    const { error } = await supabase.from("products").insert({ ...row, slug, business_id: business.id });
    if (error) return { error: "Unable to save the product. Please try again." };
    await audit({ action: "product.created", businessId: business.id, actor: actorOf(ctx), target: name });
  }

  refreshWebsite();
  redirect("/admin/products?msg=product-saved");
}

export async function deleteProduct(fd: FormData) {
  const ctx = await requireAdmin();
  const { supabase, business } = ctx;
  const id = str(fd, "id");
  const { data: product } = await supabase
    .from("products").select("id, name, image_url").eq("id", id).eq("business_id", business.id).maybeSingle();
  if (!product) redirect("/admin/products?msg=not-found");

  const { error } = await supabase.from("products").delete().eq("id", id).eq("business_id", business.id);
  if (error) redirect("/admin/products?msg=error");
  const path = storagePath(product.image_url);
  if (path) await supabase.storage.from("product-images").remove([path]);
  await audit({ action: "product.deleted", businessId: business.id, actor: actorOf(ctx), target: product.name });

  refreshWebsite();
  redirect("/admin/products?msg=product-deleted");
}

// ---------------------------------------------------------------- categories

export async function createCategory(fd: FormData) {
  const ctx = await requireAdmin();
  const { supabase, business } = ctx;
  const name = str(fd, "name").slice(0, 60);
  if (!name) redirect("/admin/categories");

  const { data: existing } = await supabase
    .from("categories").select("slug, display_order").eq("business_id", business.id);
  const taken = new Set((existing ?? []).map((c) => c.slug));
  const base = slugify(name) || "category";
  let slug = base;
  for (let n = 2; taken.has(slug); n++) slug = `${base}-${n}`;
  const order = Math.max(0, ...(existing ?? []).map((c) => c.display_order)) + 1;

  const { error } = await supabase
    .from("categories")
    .insert({ business_id: business.id, name, name_ar: opt(fd, "name_ar")?.slice(0, 60) ?? null, slug, display_order: order });
  if (error) redirect("/admin/categories?msg=error");
  await audit({ action: "category.created", businessId: business.id, actor: actorOf(ctx), target: name });
  refreshWebsite();
  redirect("/admin/categories?msg=category-saved");
}

export async function renameCategory(fd: FormData) {
  const ctx = await requireAdmin();
  const { supabase, business } = ctx;
  const name = str(fd, "name").slice(0, 60);
  if (!name) redirect("/admin/categories");
  // slug stays stable so shared links keep working
  const { error } = await supabase
    .from("categories")
    .update({ name, name_ar: opt(fd, "name_ar")?.slice(0, 60) ?? null })
    .eq("id", str(fd, "id"))
    .eq("business_id", business.id);
  if (error) redirect("/admin/categories?msg=error");
  await audit({ action: "category.renamed", businessId: business.id, actor: actorOf(ctx), target: name });
  refreshWebsite();
  redirect("/admin/categories?msg=category-saved");
}

export async function deleteCategory(fd: FormData) {
  const ctx = await requireAdmin();
  const { supabase, business } = ctx;
  const id = str(fd, "id");
  const { count } = await supabase
    .from("products").select("id", { count: "exact", head: true })
    .eq("category_id", id).eq("business_id", business.id);
  if (count) redirect("/admin/categories?msg=category-in-use");

  const { data: deleted, error } = await supabase
    .from("categories").delete().eq("id", id).eq("business_id", business.id).select("name");
  if (error) redirect("/admin/categories?msg=error");
  await audit({ action: "category.deleted", businessId: business.id, actor: actorOf(ctx), target: deleted?.[0]?.name ?? null });
  refreshWebsite();
  redirect("/admin/categories?msg=category-deleted");
}

// ---------------------------------------------------------------- display order

/** Ids in their new order, from the Arrange page. Only ids of this business are accepted. */
function orderedIds(fd: FormData): string[] {
  return fd.getAll("ids").map(String).filter(Boolean).slice(0, 500);
}

export async function saveCategoryOrder(fd: FormData) {
  const ctx = await requireAdmin();
  const { supabase, business } = ctx;
  const ids = orderedIds(fd);
  const { data: own } = await supabase.from("categories").select("id").eq("business_id", business.id);
  const valid = new Set((own ?? []).map((c) => c.id));
  if (!ids.length || ids.some((id) => !valid.has(id))) redirect("/admin/arrange?msg=error");

  const results = await Promise.all(
    ids.map((id, i) =>
      supabase.from("categories").update({ display_order: i + 1 }).eq("id", id).eq("business_id", business.id),
    ),
  );
  if (results.some((r) => r.error)) redirect("/admin/arrange?msg=error");
  await audit({ action: "categories.reordered", businessId: business.id, actor: actorOf(ctx) });
  refreshWebsite();
  redirect("/admin/arrange?msg=order-saved");
}

export async function saveProductOrder(fd: FormData) {
  const ctx = await requireAdmin();
  const { supabase, business } = ctx;
  const categoryId = str(fd, "category_id");
  const back = `/admin/arrange?category=${encodeURIComponent(categoryId)}`;
  const ids = orderedIds(fd);
  const { data: own } = await supabase
    .from("products").select("id").eq("business_id", business.id).eq("category_id", categoryId);
  const valid = new Set((own ?? []).map((p) => p.id));
  if (!ids.length || ids.some((id) => !valid.has(id))) redirect(`${back}&msg=error`);

  const results = await Promise.all(
    ids.map((id, i) =>
      supabase.from("products").update({ display_order: i + 1 }).eq("id", id).eq("business_id", business.id),
    ),
  );
  if (results.some((r) => r.error)) redirect(`${back}&msg=error`);
  await audit({ action: "products.reordered", businessId: business.id, actor: actorOf(ctx) });
  refreshWebsite();
  redirect(`${back}&msg=order-saved`);
}

/** Order of the homepage "All" view. Saves every listed product's position. */
export async function saveHomeOrder(fd: FormData) {
  const ctx = await requireAdmin();
  const { supabase, business } = ctx;
  const back = "/admin/arrange?category=all";
  const ids = orderedIds(fd);
  const { data: own } = await supabase.from("products").select("id").eq("business_id", business.id);
  const valid = new Set((own ?? []).map((p) => p.id));
  if (!ids.length || ids.some((id) => !valid.has(id))) redirect(`${back}&msg=error`);

  const results = await Promise.all(
    ids.map((id, i) =>
      supabase.from("products").update({ home_order: i + 1 }).eq("id", id).eq("business_id", business.id),
    ),
  );
  if (results.some((r) => r.error)) redirect(`${back}&msg=error`);
  await audit({ action: "home.reordered", businessId: business.id, actor: actorOf(ctx) });
  refreshWebsite();
  redirect(`${back}&msg=order-saved`);
}
