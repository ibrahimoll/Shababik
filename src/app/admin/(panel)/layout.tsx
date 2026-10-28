import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Icon } from "@/components/Icon";
import { NavLinks, type NavItem } from "@/components/ui/NavLinks";
import { requireAdmin } from "@/lib/auth";
import { adminLogout } from "../actions";
import "../../panel.css";
import { saPath } from "@/lib/sa-link";

export const metadata: Metadata = { title: "Admin", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

const NAV: NavItem[] = [
  { href: "/admin", label: "Dashboard", short: "Home", icon: "grid", exact: true },
  { href: "/admin/products", label: "Products", icon: "box" },
  { href: "/admin/categories", label: "Categories", icon: "tag" },
  { href: "/admin/arrange", label: "Arrange", short: "Order", icon: "menu" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { business, isSuperAdmin } = await requireAdmin();
  return (
    <div className="panel panel-admin">
      {isSuperAdmin && (
        <div className="impersonation">
          Super Admin view of <b>{business.name}</b>
          <Link href={await saPath("")}>Back to Super Admin</Link>
        </div>
      )}
      <div className="shell">
        <aside className="sidebar">
          <div className="side-brand">
            {business.logo_url && (
              <Image src={business.logo_url} alt="" width={88} height={88} className="side-logo" />
            )}
            <span className="side-title">{business.name}</span>
            <span className="side-sub">Website admin</span>
          </div>
          <NavLinks items={NAV} className="side-nav" />
          {!isSuperAdmin && (
            <Link href="/admin/password" className="side-logout side-foot">
              <Icon name="key" size={20} /> Change password
            </Link>
          )}
          <form action={adminLogout} className={isSuperAdmin ? "side-foot" : undefined}>
            <button type="submit" className="side-logout">
              <Icon name="logout" size={20} /> Logout
            </button>
          </form>
        </aside>

        <header className="topbar-mobile">
          <span className="side-title">{business.name}</span>
          <form action={adminLogout}>
            <button type="submit" className="pbtn pbtn-ghost pbtn-sm" aria-label="Logout">
              <Icon name="logout" size={18} />
            </button>
          </form>
        </header>

        <main className="content">{children}</main>
        <NavLinks items={NAV} className="tabbar" />
      </div>
    </div>
  );
}
