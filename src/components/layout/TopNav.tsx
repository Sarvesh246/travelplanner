"use client";

import { Plane, Search, Bell } from "lucide-react";
import Link from "next/link";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import { UserAvatar } from "@/components/shared/UserAvatar";
import { useState, useRef, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useCommandPalette } from "@/hooks/useCommandPalette";

interface TopNavProps {
  user: { name: string; email: string; avatarUrl?: string | null };
  onCommandPaletteOpen?: () => void;
}

export function TopNav({ user, onCommandPaletteOpen }: TopNavProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const supabase = createClient();
  const openPalette = useCommandPalette((s) => s.setOpen);
  const handleOpenPalette = onCommandPaletteOpen ?? (() => openPalette(true));

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/login");
    toast.success("Signed out");
  }

  return (
    <header className="h-14 border-b border-border bg-background/80 backdrop-blur-md sticky top-0 z-40 flex items-center px-4 gap-4">
      <Link href="/dashboard" className="flex items-center gap-2 shrink-0">
        <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
          <Plane className="w-3.5 h-3.5 text-white rotate-45" />
        </div>
        <span className="font-bold text-base tracking-tight hidden sm:block">Groovy</span>
      </Link>

      <div className="flex-1" />

      <button
        onClick={handleOpenPalette}
        className="hidden md:flex items-center gap-2 text-sm text-muted-foreground bg-muted hover:bg-muted/80 rounded-lg px-3 py-1.5 transition-colors"
      >
        <Search className="w-3.5 h-3.5" />
        <span>Search...</span>
        <kbd className="ml-2 text-xs bg-background border border-border rounded px-1.5 py-0.5 font-mono">
          ⌘K
        </kbd>
      </button>

      <button
        onClick={handleOpenPalette}
        className="md:hidden w-9 h-9 flex items-center justify-center rounded-lg text-muted-foreground hover:bg-muted transition-colors"
      >
        <Search className="w-4 h-4" />
      </button>

      <button className="w-9 h-9 flex items-center justify-center rounded-lg text-muted-foreground hover:bg-muted transition-colors relative">
        <Bell className="w-4 h-4" />
      </button>

      <ThemeToggle />

      <div className="relative" ref={menuRef}>
        <button onClick={() => setMenuOpen(!menuOpen)} className="rounded-full">
          <UserAvatar name={user.name} avatarUrl={user.avatarUrl} size="sm" />
        </button>

        {menuOpen && (
          <div className="absolute right-0 top-full mt-2 w-56 bg-popover border border-border rounded-xl shadow-lg py-1 z-50">
            <div className="px-3 py-2 border-b border-border mb-1">
              <p className="text-sm font-medium truncate">{user.name}</p>
              <p className="text-xs text-muted-foreground truncate">{user.email}</p>
            </div>
            <Link
              href="/dashboard"
              className="flex items-center px-3 py-2 text-sm hover:bg-muted transition-colors"
              onClick={() => setMenuOpen(false)}
            >
              My Trips
            </Link>
            <button
              onClick={handleSignOut}
              className={cn(
                "w-full text-left flex items-center px-3 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors"
              )}
            >
              Sign out
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
