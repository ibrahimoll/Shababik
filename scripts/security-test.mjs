// Security acceptance test — talks to the Supabase API directly (bypassing the UI)
// to prove that business isolation is enforced by the database.
// Usage: npm run test:security   (needs the bootstrap accounts in .env.local)
// It creates a temporary second business and removes it at the end.
import { createClient } from "@supabase/supabase-js";

const { NEXT_PUBLIC_SUPABASE_URL: url, NEXT_PUBLIC_SUPABASE_ANON_KEY: anonKey, SUPABASE_SERVICE_ROLE_KEY: serviceKey } = process.env;
const opts = { auth: { persistSession: false, autoRefreshToken: false } };
const service = createClient(url, serviceKey, opts);
const anon = createClient(url, anonKey, opts);

let failures = 0;
const check = (name, ok, detail = "") => {
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${!ok && detail ? `  → ${detail}` : ""}`);
  if (!ok) failures++;
};

async function signIn(email, password) {
  const c = createClient(url, anonKey, opts);
  const { error } = await c.auth.signInWithPassword({ email, password });
  if (error) throw new Error(`login ${email}: ${error.message}`);
  return c;
}

// --- fixtures: a second business with one category + product
const { data: shababik } = await service.from("businesses").select("id, about_text").eq("slug", "shababik").single();
const { data: other } = await service.from("businesses")
  .insert({ name: "Other Test Shop", slug: `other-test-${Date.now()}`, status: "active" }).select("id").single();
const { data: otherCat } = await service.from("categories")
  .insert({ business_id: other.id, name: "Misc", slug: "misc" }).select("id").single();
const { data: otherProd } = await service.from("products")
  .insert({ business_id: other.id, category_id: otherCat.id, name: "Secret", slug: "secret", ask_for_price: true }).select("id").single();

try {
  // ---------------- anonymous visitor
  const { data: rawBiz } = await anon.from("businesses").select("*");
  check("anon cannot read businesses table (fees, renewal)", (rawBiz ?? []).length === 0);
  const { data: pub, error: pubErr } = await anon.from("public_businesses").select("*").eq("slug", "shababik").single();
  check("anon can read public business profile", !!pub && !pubErr, pubErr?.message);
  check("public profile hides fees", pub && !("setup_fee" in pub) && !("next_payment_date" in pub) && !("monthly_fee" in pub));
  const { data: anonProducts } = await anon.from("products").select("id").eq("business_id", shababik.id);
  check("anon can read Shababik products", (anonProducts ?? []).length > 0);
  const { error: anonIns } = await anon.from("products").insert({ business_id: shababik.id, category_id: otherCat.id, name: "x", slug: "x", ask_for_price: true });
  check("anon cannot insert products", !!anonIns);
  const { data: anonProfiles } = await anon.from("profiles").select("*");
  check("anon cannot read profiles", (anonProfiles ?? []).length === 0);

  // ---------------- Shababik admin
  const admin = await signIn(process.env.SHABABIK_ADMIN_EMAIL, process.env.SHABABIK_ADMIN_PASSWORD);

  const { data: seeOther } = await admin.from("businesses").select("id").eq("id", other.id);
  check("admin cannot read another business", (seeOther ?? []).length === 0);

  const { data: upd } = await admin.from("products").update({ name: "HACKED" }).eq("id", otherProd.id).select();
  const { data: stillSecret } = await service.from("products").select("name").eq("id", otherProd.id).single();
  check("admin cannot edit another business's product", (upd ?? []).length === 0 && stillSecret.name === "Secret");

  const { data: del } = await admin.from("products").delete().eq("id", otherProd.id).select();
  check("admin cannot delete another business's product", (del ?? []).length === 0);

  const { error: insOther } = await admin.from("products")
    .insert({ business_id: other.id, category_id: otherCat.id, name: "Injected", slug: "injected", ask_for_price: true });
  check("admin cannot create products in another business", !!insOther);

  const { data: myCat } = await admin.from("categories").select("id").eq("business_id", shababik.id).limit(1).single();
  const { error: moveErr } = await admin.from("products")
    .update({ business_id: other.id }).eq("business_id", shababik.id).eq("slug", "beeswax");
  const { data: stillOurs } = await service.from("products").select("business_id").eq("slug", "beeswax").single();
  check("admin cannot move a product to another business", !!moveErr && stillOurs.business_id === shababik.id);

  const { error: crossCat } = await admin.from("products")
    .insert({ business_id: shababik.id, category_id: otherCat.id, name: "X", slug: "x-cross", ask_for_price: true });
  check("admin cannot use another business's category", !!crossCat);

  const { data: statusUpd } = await admin.from("businesses").update({ status: "active", setup_fee: 0 }).eq("id", shababik.id).select();
  const { data: feeNow } = await service.from("businesses").select("setup_fee").eq("id", shababik.id).single();
  check("admin cannot change subscription / status fields", (statusUpd ?? []).length === 0 && Number(feeNow.setup_fee) > 0);

  const { data: textUpd } = await admin.from("businesses").update({ about_text: "Updated by test", whatsapp_number: "96100000000" }).eq("id", shababik.id).select();
  const { data: bizNow } = await service.from("businesses").select("about_text").eq("id", shababik.id).single();
  check("admin cannot edit website info / WhatsApp (Super Admin only)", (textUpd ?? []).length === 0 && bizNow.about_text !== "Updated by test");

  const { data: profs } = await admin.from("profiles").select("role");
  check("admin only sees own profile", (profs ?? []).length === 1);

  const { error: escal } = await admin.from("profiles").update({ role: "super_admin", business_id: null }).eq("email", process.env.SHABABIK_ADMIN_EMAIL);
  const { data: me } = await service.from("profiles").select("role").eq("email", process.env.SHABABIK_ADMIN_EMAIL).single();
  check("admin cannot promote self to super admin", me.role === "admin", escal?.message);

  const png = new Blob([Uint8Array.from([137, 80, 78, 71, 13, 10, 26, 10])], { type: "image/png" });
  const { error: upOwn } = await admin.storage.from("product-images").upload(`${shababik.id}/test-${Date.now()}.png`, png, { contentType: "image/png" });
  check("admin can upload to own folder", !upOwn, upOwn?.message);
  const { error: upOther } = await admin.storage.from("product-images").upload(`${other.id}/evil.png`, png, { contentType: "image/png" });
  check("admin cannot upload to another business folder", !!upOther);
  const svg = new Blob(["<svg xmlns='http://www.w3.org/2000/svg'/>"], { type: "image/svg+xml" });
  const { error: upSvg } = await admin.storage.from("product-images").upload(`${shababik.id}/x.svg`, svg, { contentType: "image/svg+xml" });
  check("non-image formats (SVG) are rejected", !!upSvg);

  // ---------------- suspension
  await service.from("businesses").update({ status: "suspended" }).eq("id", shababik.id);
  const { data: suspendedProducts } = await anon.from("products").select("id").eq("business_id", shababik.id);
  check("suspended business: products hidden from public", (suspendedProducts ?? []).length === 0);
  const { data: suspendedUpd } = await admin.from("products").update({ name: "while suspended" }).eq("business_id", shababik.id).select();
  check("suspended business: admin writes blocked", (suspendedUpd ?? []).length === 0);
  await service.from("businesses").update({ status: "active" }).eq("id", shababik.id);

  // ---------------- super admin
  const sa = await signIn(process.env.SUPER_ADMIN_EMAIL, process.env.SUPER_ADMIN_PASSWORD);
  const { data: all } = await sa.from("businesses").select("id");
  check("super admin sees all businesses", (all ?? []).length >= 2);
  const { error: saUpd } = await sa.from("businesses").update({ monthly_fee: 10, next_payment_date: "2026-11-07" }).eq("id", shababik.id);
  check("super admin can update subscription fields", !saUpd, saUpd?.message);
  const { data: auditRows } = await sa.from("audit_log").select("id").limit(1);
  check("super admin can read audit log", Array.isArray(auditRows));
  const { data: adminAudit } = await admin.from("audit_log").select("id");
  check("admin cannot read audit log", (adminAudit ?? []).length === 0);
  const { data: anonAudit } = await anon.from("audit_log").select("id");
  check("anon cannot read audit log", (anonAudit ?? []).length === 0);
  const { data: attempts } = await sa.from("login_attempts").select("id");
  check("nobody can read login attempts through the API", (attempts ?? []).length === 0);
  const { error: forgeAudit } = await admin.from("audit_log").insert({ action: "forged" });
  check("audit log cannot be forged through the API", !!forgeAudit);
  const { error: signupErr } = await anon.auth.signUp({ email: `intruder${Date.now()}@test.local`, password: "Intruder-Pass-2026" });
  check("public sign-up is disabled", !!signupErr);
  void myCat;
} finally {
  await service.from("businesses").update({ about_text: shababik.about_text, status: "active" }).eq("id", shababik.id);
  await service.from("businesses").delete().eq("id", other.id);
  const { data: files } = await service.storage.from("product-images").list(shababik.id);
  const tests = (files ?? []).filter((f) => f.name.startsWith("test-")).map((f) => `${shababik.id}/${f.name}`);
  if (tests.length) await service.storage.from("product-images").remove(tests);
}

console.log(failures ? `\n${failures} check(s) FAILED` : "\nAll security checks passed.");
process.exit(failures ? 1 : 0);
