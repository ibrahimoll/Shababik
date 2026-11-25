import type { Product } from "./types";

/** Lowercase, drop accents / Arabic diacritics and unify Arabic letter variants (أ إ آ → ا, ى → ي, ة → ه). */
export function normalize(text: string): string {
  return text
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[̀-ًͯ-ٰٟـ]/g, "")
    .replace(/[أإآٱ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/\s+/g, " ")
    .trim();
}

/** True when every word of the query appears in the product (both languages) or its category name. */
export function matchesSearch(p: Product, categoryNames: string[], query: string): boolean {
  const words = normalize(query).split(" ").filter(Boolean);
  if (!words.length) return true;
  const text = normalize(
    [p.name, p.name_ar, p.short_description, p.short_description_ar, p.options, p.options_ar, ...categoryNames]
      .filter(Boolean)
      .join(" "),
  );
  return words.every((w) => text.includes(w));
}
