import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Icon } from "@/components/Icon";
import { NavLinks, type NavItem } from "@/components/ui/NavLinks";
import { requireManagedBusiness } from "@/lib/auth";
import { openAdmin, superAdminLogout } from "../actions";
import "../../panel.css";
import { saPath } from "@/lib/sa-link";

export const metadata: Metadata = { title: "Super Admin", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  const { profile, business } = await requireManagedBusiness();
  const NAV: NavItem[] = [
    { href: await saPath(""), label: "Overview", icon: "grid", exact: true },
    { href: await saPath("/settings"), label: "Settings", icon: "globe", exact: true },
  ];
  return (
    <div className="panel panel-admin">
      <div className="shell">
        <aside className="sidebar">
          <div className="side-brand">
            {business.logo_url && (
              <Image src={business.logo_url} alt="" width={88} height={88} className="side-logo" />
            )}
            <span className="side-title">{business.name}</span>
            <span className="side-sub">Super Admin · {profile.email}</span>
          </div>
          <NavLinks items={NAV} className="side-nav" />
          <form action={openAdmin}>
            <button type="submit" className="side-logout">
              <Icon name="box" size={20} /> Open Admin
            </button>
          </form>
          <Link href={await saPath("/password")} className="side-logout side-foot">
            <Icon name="key" size={20} /> Change password
          </Link>
          <form action={superAdminLogout}>
            <button type="submit" className="side-logout">
              <Icon name="logout" size={20} /> Logout
            </button>
          </form>
        </aside>
        <header className="topbar-mobile">
          <span className="side-title">{business.name}</span>
          <form action={superAdminLogout}>
            <button type="submit" className="pbtn pbtn-ghost pbtn-sm" aria-label="Logout">
              <Icon name="logout" size={18} />
            </button>
          </form>
        </header>
        <main className="content content-wide">{children}</main>
        <NavLinks items={NAV} className="tabbar" />
      </div>
    </div>
  );
}
