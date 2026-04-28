import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { RootProvider } from "@/components/layout/RootProvider";
import { getAppOrigin } from "@/lib/app-url";

const metadataBase = (() => {
  try {
    return new URL(getAppOrigin());
  } catch {
    return new URL("http://localhost:3000");
  }
})();

const inter = Inter({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const jetBrainsMono = JetBrains_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase,
  title: { default: "Beacon – Plan trips together, split costs fairly", template: "%s | Beacon" },
  description:
    "Plan group trips together. Itinerary, supplies, expenses, and votes — all in one place.",
  keywords: ["trip planner", "group travel", "expense splitting", "itinerary"],
  applicationName: "Beacon",
  authors: [{ name: "Beacon" }],
  formatDetection: { telephone: false },
  /** Add to Home Screen (iOS / Android) — full-screen, app-like window */
  appleWebApp: {
    capable: true,
    title: "Beacon",
    statusBarStyle: "black-translucent",
  },
  icons: {
    icon: [
      { url: "/icons/32", sizes: "32x32", type: "image/png" },
      { url: "/icons/192", sizes: "192x192", type: "image/png" },
    ],
    apple: [{ url: "/icons/180", sizes: "180x180", type: "image/png" }],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // Track the dark/light backgrounds in globals.css so browser chrome blends in.
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "hsl(90, 14%, 96%)" },
    { media: "(prefers-color-scheme: dark)", color: "hsl(130, 8%, 8%)" },
  ],
  colorScheme: "dark light",
  // Standalone PWA on notched iPhones: page can use safe-area env() insets (see globals + layouts).
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${jetBrainsMono.variable} min-h-dvh touch-manipulation font-sans`}
      >
        {/* beforeInteractive scripts are injected into <head> by Next.js even when declared here. */}
        <Script
          id="beacon-preferences"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html:
              "(function(){try{var r=document.documentElement;var t=localStorage.getItem('beacon-theme')==='light'?'light':'dark';var s=false;try{s=window.matchMedia('(display-mode: standalone)').matches||window.navigator.standalone===true;}catch(_e){}r.classList.remove('light','dark');r.classList.add(t);r.setAttribute('data-standalone',s?'true':'false');if(localStorage.getItem('beacon-motion')==='reduced'){r.setAttribute('data-motion','reduced');}}catch(e){}})();",
          }}
        />
        <RootProvider>{children}</RootProvider>
      </body>
    </html>
  );
}
