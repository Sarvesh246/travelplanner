import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Server Actions default body limit is ~1MB. Trip cover uploads allow up to 4MB
  // (`uploadTripCover`); without this, the browser often shows
  // "NetworkError when attempting to fetch resource" and the action never runs.
  experimental: {
    serverActions: {
      bodySizeLimit: "5mb",
    },
    // Tree-shake big libraries that re-export many small icons / utilities.
    // Cuts ~30–40% off the client bundle for routes that import a handful of
    // icons or radix primitives.
    optimizePackageImports: [
      "lucide-react",
      "framer-motion",
      "date-fns",
      "recharts",
      "@radix-ui/react-dialog",
      "@radix-ui/react-dropdown-menu",
      "@radix-ui/react-popover",
      "@radix-ui/react-tooltip",
      "@radix-ui/react-tabs",
      "@radix-ui/react-select",
      "@radix-ui/react-accordion",
      "@radix-ui/react-alert-dialog",
    ],
  },
  images: {
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 60 * 60 * 24 * 7,
    remotePatterns: [
      { protocol: "https", hostname: "staticmap.openstreetmap.de" },
      { protocol: "https", hostname: "**.supabase.co" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "avatars.githubusercontent.com" },
    ],
  },
  poweredByHeader: false,
  reactStrictMode: true,
  productionBrowserSourceMaps: false,
};

export default nextConfig;
