import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";
import { Cormorant_Garamond, DM_Sans, Amiri, Tajawal } from "next/font/google";
import "./globals.css";

const serif = Cormorant_Garamond({ subsets: ["latin"], weight: ["500", "600", "700"], variable: "--font-serif", display: "swap" });
const sans = DM_Sans({ subsets: ["latin"], variable: "--font-sans", display: "swap" });
const arabic = Amiri({ subsets: ["arabic"], weight: ["400", "700"], variable: "--font-arabic", display: "swap" });
const arabicSans = Tajawal({ subsets: ["arabic"], weight: ["400", "500", "700"], variable: "--font-arabic-sans", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3100"),
  title: "Shababik Arts & Crafts | Handmade Gifts & Crafts Lebanon",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#00347f",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // Reading the request headers makes every page render per request, so each one
  // gets the fresh CSP nonce from middleware (Next.js applies it to its scripts).
  await headers();
  return (
    <html lang="en" className={`${serif.variable} ${sans.variable} ${arabic.variable} ${arabicSans.variable}`}>
      <body>{children}</body>
    </html>
  );
}
