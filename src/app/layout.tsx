import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { RootProvider } from "@/components/layout/RootProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: { default: "Groovy – Group Trip Planner", template: "%s | Groovy" },
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
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} font-sans min-h-screen`}
      >
        <RootProvider>{children}</RootProvider>
      </body>
    </html>
  );
}
