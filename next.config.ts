import type { NextConfig } from "next";

const isDevelopment = process.env.NODE_ENV === "development";
const hasGoogleTagManager = /^GTM-[A-Z0-9]+$/.test(
  process.env.NEXT_PUBLIC_GTM_ID?.trim() ?? "",
);

const googleTagManagerOrigins = [
  "https://www.googletagmanager.com",
  "https://www.google-analytics.com",
];

const scriptSources = [
  "script-src 'self' 'unsafe-inline'",
  ...(isDevelopment ? ["'unsafe-eval'"] : []),
  ...(hasGoogleTagManager ? googleTagManagerOrigins : []),
].join(" ");

const connectSources = [
  "connect-src 'self'",
  ...(hasGoogleTagManager
    ? [
        "https://analytics.google.com",
        "https://*.analytics.google.com",
        "https://www.google-analytics.com",
        "https://*.google-analytics.com",
        "https://*.googletagmanager.com",
        "https://stats.g.doubleclick.net",
      ]
    : []),
  ...(isDevelopment
    ? [
        "http://localhost:*",
        "http://127.0.0.1:*",
        "ws://localhost:*",
        "ws://127.0.0.1:*",
      ]
    : []),
].join(" ");

const imageSources = [
  "img-src 'self' data: blob:",
  ...(hasGoogleTagManager
    ? [
        "https://www.googletagmanager.com",
        "https://*.google-analytics.com",
        "https://*.googletagmanager.com",
        "https://*.g.doubleclick.net",
      ]
    : []),
].join(" ");

const frameSources = [
  "frame-src 'self'",
  ...(hasGoogleTagManager ? ["https://www.googletagmanager.com"] : []),
].join(" ");

const contentSecurityPolicy = [
  "default-src 'self'",
  scriptSources,
  "style-src 'self' 'unsafe-inline'",
  imageSources,
  "font-src 'self' data:",
  connectSources,
  frameSources,
  "manifest-src 'self'",
  "media-src 'self'",
  "worker-src 'self' blob:",
  "base-uri 'self'",
  "object-src 'none'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  ...(isDevelopment ? [] : ["upgrade-insecure-requests"]),
].join("; ");

const securityHeaders = [
  {
    key: "Content-Security-Policy",
    value: contentSecurityPolicy,
  },
  {
    key: "Cross-Origin-Opener-Policy",
    value: "same-origin",
  },
  {
    key: "Cross-Origin-Resource-Policy",
    value: "same-origin",
  },
  {
    key: "Permissions-Policy",
    value:
      "accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=()",
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "X-DNS-Prefetch-Control",
    value: "on",
  },
  {
    key: "X-Frame-Options",
    value: "DENY",
  },
  {
    key: "X-Permitted-Cross-Domain-Policies",
    value: "none",
  },
  {
    key: "X-XSS-Protection",
    value: "0",
  },
];

const nextConfig: NextConfig = {
  cacheComponents: true,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
  poweredByHeader: false,
  reactCompiler: true,
};

export default nextConfig;
