import type { MetadataRoute } from "next";
import { getAppOrigin } from "@/lib/app-url";

const base = (() => {
  try {
    return new URL(getAppOrigin());
  } catch {
    return new URL("http://localhost:3000");
  }
})();

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Beacon",
    short_name: "Beacon",
    description: "Plan group trips together. Itinerary, supplies, expenses, and votes in one place.",
    start_url: "/dashboard",
    scope: "/",
    id: new URL("/", base).toString(),
    display: "standalone",
    display_override: ["standalone", "minimal-ui", "browser"],
    orientation: "any",
    background_color: "#0f120f",
    theme_color: "#0f120f",
    categories: ["travel", "lifestyle", "productivity", "social"],
    lang: "en",
    dir: "ltr",
    launch_handler: {
      client_mode: "navigate-existing",
    },
    shortcuts: [
      { name: "My trips", short_name: "Trips", url: "/dashboard" },
      { name: "New trip", short_name: "New", url: "/trips/new" },
    ],
    icons: [
      {
        src: new URL("/icons/192", base).toString(),
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: new URL("/icons/512", base).toString(),
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: new URL("/icons/512", base).toString(),
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
