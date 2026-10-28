import type { Metadata } from "next";
import "../../site.css";

// Preview addresses for businesses without their own domain — keep them out of search results.
export const metadata: Metadata = { robots: { index: false, follow: false } };

export default function PreviewLayout({ children }: { children: React.ReactNode }) {
  return children;
}
