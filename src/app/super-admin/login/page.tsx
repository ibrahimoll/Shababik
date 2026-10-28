import type { Metadata } from "next";
import Image from "next/image";
import { Icon } from "@/components/Icon";
import { LoginForm } from "@/components/panel/LoginForm";
import { superAdminLogin } from "../actions";
import "../../panel.css";

export const metadata: Metadata = { title: "Super Admin login", robots: { index: false, follow: false } };

export default async function SuperAdminLoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  return (
    <div className="panel panel-admin login-split">
      <aside className="login-visual">
        <Image src="/hero/hero-main.png" alt="" fill priority sizes="(max-width: 900px) 100vw, 50vw" className="login-photo" />
        <div className="login-visual-inner">
          <div className="login-brand">
            <Image src="/brand/logo.png" alt="" width={112} height={112} className="login-logo" />
            <span className="login-brand-name">Shababik</span>
            <span className="login-brand-ar" lang="ar" dir="rtl">شبابيك</span>
          </div>
          <div className="login-quote">
            <p>Everything about Shababik, in one place.</p>
            <ul>
              <li><Icon name="alert" size={17} /> Website status &amp; monthly payments</li>
              <li><Icon name="key" size={17} /> Admin logins &amp; passwords</li>
              <li><Icon name="globe" size={17} /> Website texts, links &amp; WhatsApp</li>
            </ul>
          </div>
        </div>
      </aside>

      <main className="login-pane">
        <div className="login-arch" aria-hidden="true" />
        <LoginForm
          action={superAdminLogin}
          className="login-form"
          title="Super Admin"
          subtitle="Sign in to manage the Shababik website."
          notice={error === "forbidden" ? "You do not have permission to access this page." : null}
        />
      </main>
    </div>
  );
}
