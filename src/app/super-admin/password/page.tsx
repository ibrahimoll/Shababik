import type { Metadata } from "next";
import { PasswordForm } from "@/components/panel/PasswordForm";
import { requireSuperAdmin } from "@/lib/auth";
import "../../panel.css";
import { saPath } from "@/lib/sa-link";

export const metadata: Metadata = { title: "Change password", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function SuperAdminPasswordPage() {
  const { profile } = await requireSuperAdmin(true);
  return (
    <div className="panel panel-admin login-shell">
      <PasswordForm forced={profile.must_change_password} backHref={await saPath("")} />
    </div>
  );
}
