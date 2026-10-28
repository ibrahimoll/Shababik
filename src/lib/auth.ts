import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "./supabase/server";
import { saBaseFromRequest, saPath } from "./sa-link";
import { createServiceClient } from "./supabase/service";
import { superAdminEmail } from "./sa-path";
import type { Business, Profile } from "./types";

/** Cookie set when the super admin clicks "Open Admin". */
export const SA_BUSINESS_COOKIE = "sa_business";

export const getSessionProfile = cache(async () => {
  const supabase = await createClient();
  // getUser() validates the JWT with Supabase Auth (never trust the cookie alone).
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { supabase, user: null, profile: null as Profile | null };
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("auth_user_id", user.id)
    .maybeSingle<Profile>();
  return { supabase, user, profile };
});

/** Guard for every Super Admin page and action. */
export async function requireSuperAdmin(allowPasswordChange = false) {
  const ctx = await getSessionProfile();
  if (!ctx.user) redirect(await saPath("/login"));
  const allowed = superAdminEmail();
  if (
    !ctx.profile ||
    ctx.profile.role !== "super_admin" ||
    !ctx.profile.is_active ||
    !allowed ||
    ctx.profile.email.toLowerCase() !== allowed // only the one configured email, ever
  ) {
    redirect(await saPath("/login?error=forbidden"));
  }
  // remember the console address on the account, so /admin/login can redirect here from any browser
  const base = await saBaseFromRequest();
  if (base && ctx.user.app_metadata?.console_path !== base) {
    await createServiceClient().auth.admin.updateUserById(ctx.user.id, { app_metadata: { console_path: base } });
  }
  if (ctx.profile.must_change_password && !allowPasswordChange) redirect(await saPath("/password"));
  return { supabase: ctx.supabase, user: ctx.user, profile: ctx.profile };
}

/**
 * The Super Admin console manages one business (DEFAULT_BUSINESS_SLUG, e.g. "shababik").
 * Resolved on the server — never taken from a form or URL.
 */
export async function requireManagedBusiness() {
  const { supabase, profile } = await requireSuperAdmin();
  const slug = process.env.DEFAULT_BUSINESS_SLUG || "shababik";
  const { data } = await supabase.from("businesses").select("*").eq("slug", slug).maybeSingle<Business>();
  if (!data) throw new Error(`Business "${slug}" not found — run supabase/seed.sql or check DEFAULT_BUSINESS_SLUG.`);
  return { supabase, profile, business: data };
}

/**
 * Guard for every Admin page and action. Returns the ONE business this session may manage.
 * - admin: their assigned business (blocked if disabled or business suspended,
 *   and sent to change a temporary password first)
 * - super admin: the managed business, via "Open Admin"
 */
export const requireAdmin = cache(async (allowPasswordChange: boolean = false) => {
  const ctx = await getSessionProfile();
  if (!ctx.user) redirect("/admin/login");
  const profile = ctx.profile;
  if (!profile || !profile.is_active) redirect("/admin/login?error=disabled");

  if (profile.role === "super_admin") {
    await requireSuperAdmin();
    const businessId = (await cookies()).get(SA_BUSINESS_COOKIE)?.value;
    if (!businessId) redirect(await saPath(""));
    const { data: business } = await ctx.supabase
      .from("businesses").select("id, name, slug, status, logo_url").eq("id", businessId).maybeSingle();
    if (!business) redirect(await saPath(""));
    return { supabase: ctx.supabase, user: ctx.user, profile, business, isSuperAdmin: true };
  }

  // RLS + my_business_id() return nothing when the business is suspended.
  const { data: business } = await ctx.supabase
    .from("businesses").select("id, name, slug, status, logo_url").eq("id", profile.business_id!).maybeSingle();
  if (!business || business.status === "suspended") redirect("/admin/login?error=suspended");
  if (profile.must_change_password && !allowPasswordChange) redirect("/admin/password");
  return { supabase: ctx.supabase, user: ctx.user, profile, business, isSuperAdmin: false };
});
