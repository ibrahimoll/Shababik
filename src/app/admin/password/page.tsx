import type { Metadata } from "next";
import { PasswordForm } from "@/components/panel/PasswordForm";
import { requireAdmin } from "@/lib/auth";
import "../../panel.css";

export const metadata: Metadata = { title: "Change password", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function AdminPasswordPage() {
  const { profile } = await requireAdmin(true);
  return (
    <div className="panel panel-admin login-shell">
      <PasswordForm forced={profile.must_change_password} backHref="/admin" />
    </div>
  );
}
