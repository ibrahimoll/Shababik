"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon, type IconName } from "../Icon";

export type NavItem = { href: string; label: string; short?: string; icon: IconName; exact?: boolean };

export function NavLinks({ items, className }: { items: NavItem[]; className: string }) {
  const path = usePathname();
  return (
    <nav className={className} aria-label="Sections">
      {items.map((it) => {
        const active = it.exact ? path === it.href : path === it.href || path.startsWith(it.href + "/");
        return (
          <Link key={it.href} href={it.href} aria-current={active ? "page" : undefined}>
            <Icon name={it.icon} size={20} />
            <span className="nav-full">{it.label}</span>
            <span className="nav-short">{it.short ?? it.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
