"use server";

import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { getSessionProfile, requireAdmin, requireSuperAdmin } from "@/lib/auth";
import { LOCKED_MESSAGE, audit, clientIp, failureDelay, isLockedOut, passwordProblem, recordAttempt } from "@/lib/security";
import { createServiceClient } from "@/lib/supabase/service";
import { saPath } from "@/lib/sa-link";

type State = { error?: string | null };

/** Change your own password. Requires the current password, signs out other devices. */
export async function changePassword(_: State, fd: FormData): Promise<State> {
  const ctx = await getSessionProfile();
  if (!ctx.user || !ctx.profile) redirect("/admin/login");
  const isSuper = ctx.profile.role === "super_admin";
  // the same guards as the pages (super admin must have passed 2FA)
  if (isSuper) await requireSuperAdmin(true);
  else await requireAdmin(true);

  const current = String(fd.get("current_password") ?? "");
  const next = String(fd.get("new_password") ?? "");
  const confirm = String(fd.get("confirm_password") ?? "");
  const email = ctx.profile.email;

  if (!current || !next) return { error: "Please fill in all fields." };
  if (next !== confirm) return { error: "The new passwords don't match." };
  if (next === current) return { error: "Choose a password different from the current one." };
  const problem = passwordProblem(next);
  if (problem) return { error: problem };

  // Re-check the current password on a throwaway client (keeps this session untouched).
  const ip = await clientIp();
  if (await isLockedOut("password", email, ip)) return { error: LOCKED_MESSAGE };
  const verifier = createSupabaseClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { error: wrong } = await verifier.auth.signInWithPassword({ email, password: current });
  if (wrong) {
    await recordAttempt("password", email, ip, false);
    await failureDelay();
    return { error: "Your current password is incorrect." };
  }
  await verifier.auth.signOut({ scope: "local" }); // only this throwaway session, not the user's real one

  const { error } = await ctx.supabase.auth.updateUser({ password: next });
  if (error) return { error: "Unable to change the password. Please try again." };

  await createServiceClient().from("profiles").update({ must_change_password: false }).eq("id", ctx.profile.id);
  await ctx.supabase.auth.signOut({ scope: "others" }); // log out every other device
  await audit({
    action: "password.changed",
    businessId: ctx.profile.business_id,
    actor: { id: ctx.user.id, email, role: ctx.profile.role },
  });
  redirect(isSuper ? await saPath("?msg=password-changed") : "/admin?msg=password-changed");
}
