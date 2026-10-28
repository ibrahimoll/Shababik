import type { NextConfig } from "next";

const supabaseHost = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL)
  : null;

/** Sent with every response. (The Content-Security-Policy is set per request in middleware.) */
const securityHeaders = [
  // HTTPS only, for two years, including subdomains
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  // never render inside another site's frame (clickjacking)
  { key: "X-Frame-Options", value: "DENY" },
  // don't guess file types (stops uploaded files being treated as scripts)
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  { key: "X-DNS-Prefetch-Control", value: "off" },
];

const nextConfig: NextConfig = {
  poweredByHeader: false, // don't advertise the framework
  // dev only: allow opening the dev server via this PC's network address (e.g. from a phone)
  allowedDevOrigins: ["192.168.10.167"],
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: supabaseHost
      ? [{
          protocol: supabaseHost.protocol.replace(":", "") as "http" | "https",
          hostname: supabaseHost.hostname,
          port: supabaseHost.port,
          pathname: "/storage/v1/object/public/**",
        }]
      : [],
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
