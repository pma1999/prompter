import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname,
  },
  async headers() {
    return [
      {
        source: "/api/:path*",
        headers: [
          { key: "Cache-Control", value: "no-store, no-cache, must-revalidate" },
          // Security headers (safe defaults)
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "no-referrer" },
          // HSTS only effective on HTTPS in production; harmless locally
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
          // Clickjacking protection; use CSP frame-ancestors if you have a full CSP
          { key: "X-Frame-Options", value: "DENY" },
          // Limit powerful features by default
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};

export default nextConfig;
