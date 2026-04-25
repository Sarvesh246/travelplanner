"use client";

import { Search, LogOut, LayoutDashboard, Plus } from "lucide-react";
import Link from "next/link";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import { MotionToggle } from "@/components/shared/MotionToggle";
import { UserAvatar } from "@/components/shared/UserAvatar";
import { BeaconLogo } from "@/components/shared/BeaconLogo";
import { useState, useRef, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useCommandPalette } from "@/hooks/useCommandPalette";
import { useIsMac } from "@/hooks/useIsMac";
import { useLoading } from "@/hooks/useLoading";
import { ROUTES } from "@/lib/constants";
import { Kbd } from "@/components/shared/Kbd";

interface TopNavProps {
  user: { name: string; email: string; avatarUrl?: string | null };
  onCommandPaletteOpen?: () => void;
}

export function TopNav({ user, onCommandPaletteOpen }: TopNavProps) {
  const { startLoading, stopLoading } = useLoading();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const supabase = createClient();
  const setPaletteOpen = useCommandPalette((s) => s.setOpen);
  const isMac = useIsMac();
  const handleOpenPalette = onCommandPaletteOpen ?? (() => setPaletteOpen(true));
  const modLabel = isMac ? "⌘" : "Ctrl";

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") setMenuOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  async function handleSignOut() {
    startLoading("Signing out...");
    try {
      await supabase.auth.signOut();
      router.push("/login");
      toast.success("Signed out");
    } finally {
      stopLoading();
    }
  }

  return (
    <header
      className="sticky top-0 z-40 flex min-h-14 h-14 min-w-0 items-center gap-1.5 border-b border-border bg-background/80 pt-[max(0px,env(safe-area-inset-top,0px))] backdrop-blur-md px-2.5 sm:gap-3 sm:px-4"
    >
      <Link
        href={ROUTES.dashboard}
        className="flex shrink-0 items-center gap-2 rounded-md focus-ring"
        aria-label="Go to dashboard"
        title="Dashboard (G D)"
        prefetch
      >
        <BeaconLogo className="h-9 w-9" gradientId="beaconGradient-topnav" />
        <span className="hidden text-base font-bold tracking-tight sm:block">
          Beacon
        </span>
      </Link>

      <div className="flex min-w-0 flex-1 items-center justify-end gap-1.5 sm:gap-2">
        <button
          type="button"
          onClick={handleOpenPalette}
          title={`Search commands (${isMac ? "⌘K" : "Ctrl K"} or /)`}
          aria-label="Open command palette"
          className="hidden h-9 min-h-10 min-w-0 w-full max-w-md flex-1 items-center gap-2 rounded-lg border border-transparent bg-muted/70 px-3 text-left text-sm text-muted-foreground transition-colors hover:border-border hover:bg-muted focus-ring md:inline-flex"
        >
          <Search className="h-3.5 w-3.5 shrink-0" />
          <span className="min-w-0 flex-1 truncate">Search or jump to…</span>
          <Kbd className="shrink-0 gap-0.5" keys={isMac ? "⌘ K" : "Ctrl K"} />
        </button>

        <button
          type="button"
          onClick={handleOpenPalette}
          title="Search (/)"
          aria-label="Open command palette"
          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-ring md:hidden"
        >
          <Search className="h-4 w-4" />
        </button>

        <MotionToggle className="h-10 w-10 shrink-0" />
        <ThemeToggle className="h-10 w-10 shrink-0" />

        <div className="relative shrink-0" ref={menuRef}>
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            className="rounded-full focus-ring"
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            aria-label="Account menu"
            title={user.name}
          >
            <UserAvatar name={user.name} avatarUrl={user.avatarUrl} size="sm" />
          </button>

          {menuOpen && (
            <div
              role="menu"
              className="absolute right-0 top-full z-50 mt-2 max-h-[min(70vh,28rem)] w-[min(16rem,calc(100vw-1rem))] max-w-[calc(100dvw-1rem)] overflow-y-auto rounded-xl border border-border bg-popover py-1 text-left shadow-lg animate-in fade-in slide-in-from-top-1 duration-150"
            >
              <div className="mb-1 border-b border-border px-2.5 py-2.5">
                <p className="text-sm font-medium truncate">{user.name}</p>
                <p className="text-xs text-muted-foreground truncate">{user.email}</p>
              </div>
              <MenuItem
                href={ROUTES.dashboard}
                onClick={() => setMenuOpen(false)}
                icon={<LayoutDashboard className="w-3.5 h-3.5" />}
                label="My trips"
                shortcut="G D"
                chord
              />
              <MenuItem
                href={ROUTES.newTrip}
                onClick={() => setMenuOpen(false)}
                icon={<Plus className="w-3.5 h-3.5" />}
                label="New trip"
                shortcut="N"
              />
              <MenuItem
                as="button"
                onClick={() => {
                  setMenuOpen(false);
                  handleOpenPalette();
                }}
                icon={<Search className="w-3.5 h-3.5" />}
                label="Search…"
                shortcut={`${modLabel} K`}
              />
              <div className="my-1 border-t border-border" />
              <button
                role="menuitem"
                onClick={handleSignOut}
                className="flex w-full items-center gap-2 px-2.5 py-2 text-left text-sm text-destructive transition-colors hover:bg-destructive/10"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span>Sign out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

function MenuItem({
  href,
  onClick,
  icon,
  label,
  shortcut,
  chord = false,
  as = "link",
}: {
  href?: string;
  onClick?: () => void;
  icon: React.ReactNode;
  label: string;
  shortcut?: string;
  chord?: boolean;
  as?: "link" | "button";
}) {
  const content = (
    <>
      <span className="shrink-0 text-muted-foreground [&>svg]:block">{icon}</span>
      <span className="min-w-0 flex-1 text-left">{label}</span>
      {shortcut && (
        <span className="shrink-0 pl-1">
          <Kbd className="gap-0.5" keys={shortcut} asChord={chord} />
        </span>
      )}
    </>
  );

  // text-left: native <button> is text-align:center; without this, the label can sit
  // in the center of the flex-1 track on narrow viewports.
  const className =
    "flex w-full items-center gap-2 px-2.5 py-2 text-left text-sm text-foreground transition-colors hover:bg-muted";

  if (as === "button" || !href) {
    return (
      <button role="menuitem" onClick={onClick} className={className}>
        {content}
      </button>
    );
  }

  return (
    <Link role="menuitem" href={href} onClick={onClick} className={className}>
      {content}
    </Link>
  );
}
