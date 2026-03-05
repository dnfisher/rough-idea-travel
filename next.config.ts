import type { NextConfig } from "next";

const ContentSecurityPolicy = [
  "default-src 'self'",
  // unsafe-inline required for the window.ethereum inline script in layout.tsx
  "script-src 'self' 'unsafe-inline'",
  // unsafe-inline required for Tailwind/inline styles; fontshare for Clash Display
  "style-src 'self' 'unsafe-inline' https://api.fontshare.com",
  // Clash Display from Fontshare, DM Sans / others from Google Fonts
  "font-src 'self' https://api.fontshare.com https://fonts.gstatic.com",
  // Destination photos and map tiles come from many CDN origins
  "img-src 'self' data: blob: https:",
  // API calls are server-side only; connect-src covers client fetch() calls
  "connect-src 'self'",
  "frame-ancestors 'self'",
].join("; ");

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Content-Security-Policy", value: ContentSecurityPolicy },
        ],
      },
    ];
  },
};

export default nextConfig;
