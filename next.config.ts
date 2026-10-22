import { existsSync } from "node:fs";
import type { NextConfig } from "next";

// Vídeos do hero presentes em public/videos no momento do build (ver HeroVideo).
// Evita requisições de sondagem (e 404 no console) quando os arquivos não existem.
const heroVideoFiles = ["hero.webm", "hero.mp4", "hero-mobile.mp4"].filter((f) => existsSync(`public/videos/${f}`));

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

const nextConfig: NextConfig = {
  env: { NEXT_PUBLIC_HERO_VIDEO_FILES: heroVideoFiles.join(",") },
  images: {
    formats: ["image/avif", "image/webp"],
    qualities: [75, 90],
    remotePatterns: [{ protocol: "https", hostname: "**" }],
  },
  async redirects() {
    return [
      { source: "/cadastro", destination: "/", permanent: false },
      { source: "/conta/:path*", destination: "/acompanhar", permanent: false },
    ];
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
