import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { RootProvider } from "@/components/layout/RootProvider";

const inter = Inter({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const jetBrainsMono = JetBrains_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: { default: "Beacon – Plan trips together, split costs fairly", template: "%s | Beacon" },
  description:
    "Plan group trips together. Itinerary, supplies, expenses, and votes — all in one place.",
  keywords: ["trip planner", "group travel", "expense splitting", "itinerary"],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${jetBrainsMono.variable} font-sans min-h-screen`}
      >
        <RootProvider>{children}</RootProvider>
      </body>
    </html>
  );
}
