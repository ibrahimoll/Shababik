import type { Business, BusinessStatus } from "./types";

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

export function formatPrice(price: number | null, askForPrice: boolean, askLabel = "Ask for Price"): string {
  if (askForPrice || price === null || price === undefined) return askLabel;
  const n = Number(price);
  return `$${Number.isInteger(n) ? n : n.toFixed(2)}`;
}

export function formatDate(d: string | null): string {
  if (!d) return "—";
  return new Date(d + (d.length === 10 ? "T00:00:00" : "")).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/** Monthly billing: warn a week before the next payment. */
export const PAYMENT_WARNING_DAYS = 7;

/**
 * Status shown to the platform owner. Suspension is manual; "due soon" and
 * "expired" are also derived from the next payment date so nothing is missed.
 */
export function effectiveStatus(b: Pick<Business, "status" | "next_payment_date">): BusinessStatus {
  if (b.status === "suspended") return "suspended";
  if (b.status === "expired") return "expired";
  if (b.next_payment_date) {
    const days = daysUntil(b.next_payment_date);
    if (days < 0) return "expired";
    if (days <= PAYMENT_WARNING_DAYS) return "due_soon";
  }
  return b.status === "due_soon" ? "due_soon" : "active";
}

export function daysUntil(date: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(date + "T00:00:00");
  return Math.round((target.getTime() - today.getTime()) / 86_400_000);
}

export const statusLabel: Record<BusinessStatus, string> = {
  active: "Active",
  due_soon: "Due Soon",
  expired: "Expired",
  suspended: "Suspended",
};

/** Random temporary password (shown once). Always has lower, upper and digits. */
export function tempPassword(): string {
  const lower = "abcdefghjkmnpqrstuvwxyz";
  const upper = "ABCDEFGHJKMNPQRSTUVWXYZ";
  const digits = "23456789";
  const all = lower + upper + digits;
  const pick = (set: string) => set[crypto.getRandomValues(new Uint32Array(1))[0] % set.length];
  const chars = [pick(lower), pick(upper), pick(digits)];
  while (chars.length < 16) chars.push(pick(all));
  // shuffle so the guaranteed characters aren't always first
  for (let i = chars.length - 1; i > 0; i--) {
    const j = crypto.getRandomValues(new Uint32Array(1))[0] % (i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.join("");
}

export function siteUrl(b: Pick<Business, "domain" | "slug">): string {
  return b.domain ? `https://${b.domain}` : `/s/${b.slug}`;
}

export interface ProductOption {
  label: string;
  price: number | null;
}

/**
 * Sizes / options, one per line: "12 colors: 4", "10 cm - 2.50", "Gloss".
 * The price after the separator is optional.
 */
export function parseOptions(text: string | null | undefined): ProductOption[] {
  return (text ?? "")
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
    .slice(0, 12)
    .map((line) => {
      const m = line.match(/^(.*?)\s*[:：|=—–]\s*\$?\s*(\d+(?:[.,]\d+)?)\s*\$?$/);
      return m ? { label: m[1].trim(), price: Number(m[2].replace(",", ".")) } : { label: line, price: null };
    });
}
