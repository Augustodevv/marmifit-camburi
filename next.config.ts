import type { NextConfig } from "next";
import { buildMediaManifest } from "./scripts/media-manifest";

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

const nextConfig: NextConfig = {
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

export default async function config(): Promise<NextConfig> {
  // fotos e vídeos existentes em public/ (lido só no servidor por src/lib/media.ts)
  const manifest = await buildMediaManifest();
  return { ...nextConfig, env: { MEDIA_MANIFEST: JSON.stringify(manifest) } };
}
