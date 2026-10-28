import type { Metadata } from "next";
import Image from "next/image";
import { Icon } from "@/components/Icon";
import { LoginForm } from "@/components/panel/LoginForm";
import { getBusinessForRequest } from "@/lib/site";
import { shortName } from "@/lib/whatsapp";
import { adminLogin } from "../actions";
import "../../panel.css";

export const metadata: Metadata = { title: "Admin login", robots: { index: false, follow: false } };

const NOTICES: Record<string, string> = {
  disabled: "This account has been disabled. Please contact your website provider.",
  suspended: "This website is currently suspended. Please contact your website provider.",
};

export default async function AdminLoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  // Branding only (name / Arabic name) — the login itself works for any business.
  const business = await getBusinessForRequest().catch(() => null);
  const name = business ? shortName(business.name) : "Your website";

  return (
    <div className="panel panel-admin login-split">
      <aside className="login-visual">
        <Image src="/about/about-studio.png" alt="" fill priority sizes="(max-width: 900px) 100vw, 50vw" className="login-photo" />
        <div className="login-visual-inner">
          <div className="login-brand">
            {business?.logo_url && <Image src={business.logo_url} alt="" width={112} height={112} className="login-logo" />}
            <span className="login-brand-name">{name}</span>
            {business?.arabic_name && (
              <span className="login-brand-ar" lang="ar" dir="rtl">{business.arabic_name}</span>
            )}
          </div>
          <div className="login-quote">
            <p>Add a new creation in under a minute.</p>
            <ul>
              <li><Icon name="image" size={17} /> Snap a photo from your phone</li>
              <li><Icon name="tag" size={17} /> Add a name, category and price</li>
              <li><Icon name="whatsapp" size={17} /> Customers order on WhatsApp</li>
            </ul>
          </div>
        </div>
      </aside>

      <main className="login-pane">
        <div className="login-arch" aria-hidden="true" />
        <LoginForm
          action={adminLogin}
          className="login-form"
          title="Welcome back"
          subtitle={`Sign in to manage ${business ? `the ${name} website` : "your website"} and products.`}
          notice={error ? NOTICES[error] : null}
          footnote="Trouble signing in? Contact your website provider to reset your password."
        />
      </main>
    </div>
  );
}
