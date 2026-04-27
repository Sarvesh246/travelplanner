import Link from "next/link";
import { ThemeToggle } from "@/components/shared/ThemeToggle";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <div className="flex h-14 shrink-0 items-center justify-end border-b border-border/70 bg-background/85 px-3 pt-[max(0px,env(safe-area-inset-top,0px))] backdrop-blur-md sm:px-5">
        <ThemeToggle className="h-10 w-10" />
      </div>
      <div className="flex flex-1 flex-col items-center justify-center p-4 py-8 sm:py-10">
        <div className="w-full max-w-md space-y-8">
        <div className="flex flex-col items-center gap-2">
          <Link href="/" className="flex items-center gap-2 group">
            <svg viewBox="0 0 64 64" className="w-8 h-8 group-hover:scale-105 transition-transform" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <radialGradient id="beaconGradient" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" style={{stopColor: 'hsl(var(--primary))', stopOpacity: 1}} />
                  <stop offset="100%" style={{stopColor: 'hsl(var(--secondary))', stopOpacity: 0.8}} />
                </radialGradient>
              </defs>
              <circle cx="32" cy="32" r="28" fill="none" stroke="hsl(var(--secondary))" strokeWidth="2" opacity="0.3" />
              <circle cx="32" cy="32" r="20" fill="none" stroke="hsl(var(--secondary))" strokeWidth="2" opacity="0.6" />
              <circle cx="32" cy="32" r="12" fill="none" stroke="hsl(var(--primary))" strokeWidth="2.5" opacity="0.9" />
              <circle cx="32" cy="32" r="4" fill="hsl(var(--primary))" />
              <circle cx="32" cy="32" r="2.5" fill="hsl(var(--primary))" opacity="0.6" />
            </svg>
            <span className="text-2xl font-bold tracking-tight">Beacon</span>
          </Link>
          <p className="text-muted-foreground text-sm text-center">
            Plan trips together, not in 10 different apps.
          </p>
        </div>
        {children}
        </div>
      </div>
    </div>
  );
}
