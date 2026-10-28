"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SA_BUSINESS_COOKIE, requireManagedBusiness } from "@/lib/auth";
import { LOCKED_MESSAGE, audit, clientIp, failureDelay, isLockedOut, recordAttempt } from "@/lib/security";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { cleanNumber } from "@/lib/whatsapp";
import { slugify, tempPassword } from "@/lib/utils";
import type { BusinessStatus } from "@/lib/types";
import { saPath } from "@/lib/sa-link";
import { superAdminEmail } from "@/lib/sa-path";

export type FormState = { error?: string | null };
export type CredentialsState = FormState & {
  done?: boolean;
  email?: string;
  password?: string;
};

const str = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();
const opt = (fd: FormData, k: string) => str(fd, k) || null;
const num = (fd: FormData, k: string) => {
  const n = Number(str(fd, k) || 0);
  return Number.isFinite(n) && n >= 0 ? n : 0;
};
const STATUSES: BusinessStatus[] = ["active", "due_soon", "expired", "suspended"];
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function normalizeDomain(raw: string | null): string | null {
  if (!raw) return null;
  return raw.toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*$/, "").replace(/^www\./, "") || null;
}

function validSocialUrl(url: string | null, hosts: string[]): boolean {
  if (!url) return true;
  try {
    const u = new URL(url);
    return u.protocol === "https:" && hosts.some((h) => u.hostname === h || u.hostname.endsWith(`.${h}`));
  } catch {
    return false;
  }
}

function refresh() {
  revalidatePath("/", "layout"); // public website + both panels
}

// ---------------------------------------------------------------- auth

export async function superAdminLogin(_: FormState, fd: FormData): Promise<FormState> {
  const email = str(fd, "email");
  const password = String(fd.get("password") ?? "");
  if (!email || !password) return { error: "Please enter your email and password." };

  const ip = await clientIp();
  if (await isLockedOut("password", email, ip)) return { error: LOCKED_MESSAGE };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  const { data: profile } = data.user
    ? await supabase.from("profiles").select("role, is_active").eq("auth_user_id", data.user.id).maybeSingle()
    : { data: null };
  const allowed = superAdminEmail();
  if (
    error || !data.user || !profile || profile.role !== "super_admin" || !profile.is_active ||
    !allowed || email.toLowerCase() !== allowed
  ) {
    if (data.user) await supabase.auth.signOut();
    await recordAttempt("password", email, ip, false);
    await audit({ action: "login.failed", actor: { email }, details: { area: "super-admin" } });
    await failureDelay();
    // same message for every failure: don't reveal which accounts exist
    return { error: "Invalid login details." };
  }
  await recordAttempt("password", email, ip, true);
  await audit({ action: "login", actor: { id: data.user.id, email, role: "super_admin" }, details: { area: "super-admin" } });
  redirect(await saPath(""));
}

export async function superAdminLogout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  (await cookies()).delete(SA_BUSINESS_COOKIE);
  redirect(await saPath("/login"));
}

/** "Open Admin": enter the Shababik admin panel as the platform owner. */
export async function openAdmin() {
  const { business, profile } = await requireManagedBusiness();
  await audit({ action: "admin.opened", businessId: business.id, actor: { id: profile.auth_user_id, email: profile.email, role: profile.role } });
  (await cookies()).set(SA_BUSINESS_COOKIE, business.id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 8,
  });
  redirect("/admin");
}

// ---------------------------------------------------------------- business settings

export async function saveSettings(_: FormState, fd: FormData): Promise<FormState> {
  const { supabase, business, profile } = await requireManagedBusiness();
  const name = str(fd, "name");
  const slug = slugify(str(fd, "slug"));
  const status = str(fd, "status") as BusinessStatus;
  const whatsapp = cleanNumber(str(fd, "whatsapp_number"));
  const instagram = opt(fd, "instagram_url");
  const facebook = opt(fd, "facebook_url");

  if (!name) return { error: "Business name is required." };
  if (!slug) return { error: "Please enter a valid slug." };
  if (!STATUSES.includes(status)) return { error: "Please choose a valid status." };
  if (whatsapp && (whatsapp.length < 6 || whatsapp.length > 15)) {
    return { error: "Please enter the WhatsApp number with country code, e.g. 9613113390." };
  }
  if (!validSocialUrl(instagram, ["instagram.com"])) return { error: "Please paste a full Instagram link, starting with https://www.instagram.com/" };
  if (!validSocialUrl(facebook, ["facebook.com", "fb.com"])) return { error: "Please paste a full Facebook link, starting with https://www.facebook.com/" };

  const { error } = await supabase
    .from("businesses")
    .update({
      name,
      arabic_name: opt(fd, "arabic_name"),
      hero_title: opt(fd, "hero_title"),
      hero_description: opt(fd, "hero_description"),
      about_text: opt(fd, "about_text"),
      hero_title_ar: opt(fd, "hero_title_ar"),
      hero_description_ar: opt(fd, "hero_description_ar"),
      about_text_ar: opt(fd, "about_text_ar"),
      location_ar: opt(fd, "location_ar"),
      phone: opt(fd, "phone"),
      whatsapp_number: whatsapp || null,
      location: opt(fd, "location"),
      instagram_url: instagram,
      facebook_url: facebook,
      slug,
      domain: normalizeDomain(opt(fd, "domain")),
      plan: opt(fd, "plan") ?? "Basic Website",
      setup_fee: num(fd, "setup_fee"),
      monthly_fee: str(fd, "monthly_fee") === "" ? null : num(fd, "monthly_fee"),
      next_payment_date: opt(fd, "next_payment_date"),
      status,
    })
    .eq("id", business.id);
  if (error) {
    if (error.code === "23505") return { error: "That slug or domain is already in use." };
    if (error.code === "23514") return { error: "Please check the slug and WhatsApp number format." };
    return { error: "Unable to save. Please try again." };
  }
  await audit({ action: "settings.saved", businessId: business.id, actor: { id: profile.auth_user_id, email: profile.email, role: profile.role } });
  refresh();
  redirect(await saPath("/settings?msg=settings-saved"));
}

export async function setStatus(fd: FormData) {
  const { supabase, business, profile } = await requireManagedBusiness();
  const status = str(fd, "status") as BusinessStatus;
  if (!STATUSES.includes(status)) redirect(await saPath("?msg=error"));
  const { error } = await supabase.from("businesses").update({ status }).eq("id", business.id);
  if (!error) {
    await audit({
      action: status === "suspended" ? "website.suspended" : "website.activated",
      businessId: business.id,
      actor: { id: profile.auth_user_id, email: profile.email, role: profile.role },
    });
  }
  refresh();
  redirect(await saPath(`?msg=${error ? "error" : "status-updated"}`));
}

// ---------------------------------------------------------------- admin accounts

export async function addAdmin(_: CredentialsState, fd: FormData): Promise<CredentialsState> {
  const { business, profile: me } = await requireManagedBusiness();
  const email = str(fd, "email").toLowerCase();
  const name = opt(fd, "name");
  if (!EMAIL_RE.test(email)) return { error: "Please enter a valid email." };

  const service = createServiceClient();
  const password = tempPassword();
  const { data, error } = await service.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { name } });
  if (error || !data.user) {
    const taken = /already|registered|exists/i.test(error?.message ?? "");
    return { error: taken ? "An account with this email already exists." : "Unable to create the admin account." };
  }
  const { error: pErr } = await service
    .from("profiles")
    .insert({ auth_user_id: data.user.id, business_id: business.id, name, email, role: "admin", must_change_password: true });
  if (pErr) {
    await service.auth.admin.deleteUser(data.user.id);
    return { error: "Unable to create the admin account." };
  }
  await audit({ action: "admin.created", businessId: business.id, actor: { id: me.auth_user_id, email: me.email, role: me.role }, target: email });
  refresh();
  return { done: true, email, password };
}

/** Loads an admin profile and makes sure it belongs to the managed business. */
async function ownAdmin(profileId: string) {
  const { supabase, business, profile: me } = await requireManagedBusiness();
  const { data } = await supabase
    .from("profiles")
    .select("id, auth_user_id, email, role, business_id")
    .eq("id", profileId)
    .maybeSingle();
  if (!data || data.role !== "admin" || data.business_id !== business.id) return null;
  return { supabase, profile: data, businessId: business.id, actor: { id: me.auth_user_id, email: me.email, role: me.role } };
}

export async function resetAdminPassword(_: CredentialsState, fd: FormData): Promise<CredentialsState> {
  const found = await ownAdmin(str(fd, "profile_id"));
  if (!found) return { error: "Admin account not found." };
  const password = tempPassword();
  const service = createServiceClient();
  const { error } = await service.auth.admin.updateUserById(found.profile.auth_user_id, { password });
  if (error) return { error: "Unable to reset the password. Please try again." };
  // the temporary password must be replaced at next login
  await service.from("profiles").update({ must_change_password: true }).eq("id", found.profile.id);
  await audit({ action: "admin.password_reset", businessId: found.businessId, actor: found.actor, target: found.profile.email });
  return { done: true, email: found.profile.email, password };
}

export async function setAdminActive(fd: FormData) {
  const found = await ownAdmin(str(fd, "profile_id"));
  if (!found) redirect(await saPath("?msg=not-found"));
  const active = str(fd, "active") === "true";
  await found.supabase.from("profiles").update({ is_active: active }).eq("id", found.profile.id);
  // ban/unban at the auth level too, so an existing session can't be refreshed
  await createServiceClient().auth.admin.updateUserById(found.profile.auth_user_id, {
    ban_duration: active ? "none" : "876000h",
  });
  await audit({ action: active ? "admin.enabled" : "admin.disabled", businessId: found.businessId, actor: found.actor, target: found.profile.email });
  refresh();
  redirect(await saPath("?msg=admin-updated"));
}
