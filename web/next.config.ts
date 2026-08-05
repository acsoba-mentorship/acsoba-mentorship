import type { NextConfig } from "next";

const auth0Domain = process.env.NEXT_PUBLIC_AUTH0_DOMAIN?.trim();
const auth0Origin = auth0Domain ? `https://${auth0Domain}` : "";
const isDevelopment = process.env.NODE_ENV !== "production";

const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDevelopment ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  [
    "connect-src 'self'",
    "https://*.convex.cloud",
    "wss://*.convex.cloud",
    "https://*.auth0.com",
    auth0Origin,
    isDevelopment ? "ws:" : "",
  ]
    .filter(Boolean)
    .join(" "),
  ["frame-src 'self'", "https://*.auth0.com", auth0Origin]
    .filter(Boolean)
    .join(" "),
  ["form-action 'self'", "https://*.auth0.com", auth0Origin]
    .filter(Boolean)
    .join(" "),
  "worker-src 'self' blob:",
  "object-src 'none'",
  "base-uri 'self'",
  "frame-ancestors 'none'",
].join("; ");

const nextConfig: NextConfig = {
  turbopack: {
    root: process.cwd(),
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value: contentSecurityPolicy,
          },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
