/** Builds wa.me links. Admins never type links by hand — they are generated from the number. */

export function cleanNumber(raw: string | null | undefined): string {
  return (raw ?? "").replace(/\D/g, "");
}

export function waLink(number: string | null | undefined, message?: string): string {
  const n = cleanNumber(number);
  const base = `https://wa.me/${n}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}

export function shortName(businessName: string): string {
  // "Shababik Arts & Crafts" → "Shababik"
  return businessName.replace(/\s+(arts?\s*&\s*crafts?)$/i, "").trim() || businessName;
}

export const messages = {
  general: (biz: string) =>
    `Hello ${shortName(biz)}, I saw your website and I would like to ask about your products.`,
  product: (biz: string, product: string) =>
    `Hello ${shortName(biz)}, I'm interested in the ${product}. Can you give me more information?`,
  custom: (biz: string) => `Hello ${shortName(biz)}, I would like to request a custom handmade order.`,
};
