import { Plane } from "lucide-react";
import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="flex flex-col items-center gap-2">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center group-hover:scale-105 transition-transform">
              <Plane className="w-5 h-5 text-white rotate-45" />
            </div>
            <span className="text-2xl font-bold tracking-tight">Groovy</span>
          </Link>
          <p className="text-muted-foreground text-sm text-center">
            Plan trips together, not in 10 different apps.
          </p>
        </div>
        {children}
      </div>
    </div>
  );
}
