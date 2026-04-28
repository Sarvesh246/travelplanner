"use client";

import { Search, LogOut, LayoutDashboard, Plus, Pencil } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
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
import { AppBackButton } from "@/components/layout/AppBackButton";
import { useStandaloneMode } from "@/hooks/useStandaloneMode";
import { updateTrip } from "@/actions/trips";

interface TopNavProps {
  user: { name: string; email: string; avatarUrl?: string | null };
  trip?: { id: string; name: string; canManage: boolean } | null;
  onCommandPaletteOpen?: () => void;
}

export function TopNav({ user, trip, onCommandPaletteOpen }: TopNavProps) {
  const { startLoading, stopLoading } = useLoading();
  const [menuOpen, setMenuOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();
  const setPaletteOpen = useCommandPalette((s) => s.setOpen);
  const isMac = useIsMac();
  const standalone = useStandaloneMode();
  const handleOpenPalette = onCommandPaletteOpen ?? (() => setPaletteOpen(true));
  const modLabel = isMac ? "⌘" : "Ctrl";

  const tripMatch = pathname.match(/^\/trips\/([^/]+)(?:\/([^/]+))?/);
  const tripId = tripMatch?.[1] ?? null;
  const tripSection = tripMatch?.[2] ?? null;
  const isStopDetail = /^\/trips\/[^/]+\/stops\/[^/]+/.test(pathname);
  const showBackButton =
    pathname !== ROUTES.dashboard &&
    (standalone || pathname.startsWith("/trips/"));

  const fallbackHref = (() => {
    if (pathname === ROUTES.newTrip) return ROUTES.dashboard;
    if (tripId && isStopDetail) return ROUTES.tripItinerary(tripId);
    if (tripId && tripSection && tripSection !== "overview") {
      return ROUTES.tripOverview(tripId);
    }
    if (tripId) return ROUTES.dashboard;
    return ROUTES.dashboard;
  })();

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

  useEffect(() => {
    function handleScroll() {
      if (window.innerWidth >= 640) {
        setCollapsed(false);
        return;
      }
      setCollapsed(window.scrollY > 28);
    }

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
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

  async function handleRenameTrip() {
    if (!trip?.canManage) return;
    const next = window.prompt("Trip name", trip.name);
    if (!next) return;
    const trimmed = next.trim();
    if (!trimmed || trimmed === trip.name) return;

    startLoading("Updating trip name...");
    try {
      await updateTrip(trip.id, { name: trimmed });
      toast.success("Trip name updated");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to rename trip");
    } finally {
      stopLoading();
    }
  }

  return (
    <header
      data-collapsed={collapsed ? "true" : "false"}
      className="app-top-nav sticky top-0 z-40 flex min-h-[calc(3.5rem+env(safe-area-inset-top,0px))] min-w-0 items-center gap-1.5 border-b border-border/70 bg-background/[0.82] pl-[max(0.625rem,env(safe-area-inset-left,0px))] pr-[max(0.625rem,env(safe-area-inset-right,0px))] pt-[max(0px,env(safe-area-inset-top,0px))] shadow-[0_10px_34px_-30px_hsl(var(--primary)/0.65)] backdrop-blur-xl transition-[min-height,background-color,box-shadow,padding] duration-300 sm:gap-3 sm:pl-[max(1rem,env(safe-area-inset-left,0px))] sm:pr-[max(1rem,env(safe-area-inset-right,0px))]"
    >
      {showBackButton ? (
        <AppBackButton
          fallbackHref={fallbackHref}
          label="Go back"
          className="shrink-0 sm:hidden"
        />
      ) : null}
      <Link
        href={ROUTES.dashboard}
        className="flex min-w-0 shrink items-center gap-2 rounded-md focus-ring"
        aria-label="Go to dashboard"
        title="Dashboard (G D)"
        prefetch
      >
        <BeaconLogo className="h-9 w-9" gradientId="beaconGradient-topnav" />
        <span className="app-top-nav__word truncate text-base font-bold tracking-tight sm:block">
          Beacon
        </span>
      </Link>

      <div className="flex min-w-0 flex-1 items-center justify-end gap-1.5 sm:gap-2">
        <button
          type="button"
          onClick={handleOpenPalette}
          title={`Search commands (${isMac ? "⌘K" : "Ctrl K"} or /)`}
          aria-label="Open command palette"
          className="app-glass hidden h-9 min-h-10 min-w-0 w-full max-w-md flex-1 items-center gap-2 rounded-lg px-3 text-left text-sm text-muted-foreground transition-colors hover:border-primary/25 hover:bg-card/90 hover:text-foreground focus-ring md:inline-flex"
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
          className="app-top-nav__mobile-search inline-flex h-10 min-w-0 flex-1 items-center justify-center rounded-xl border border-transparent px-0 text-muted-foreground transition-[background-color,border-color,box-shadow,color,width] duration-200 hover:bg-muted/80 hover:text-foreground focus-ring md:hidden"
        >
          <Search className="h-4 w-4" />
          <span className="app-top-nav__mobile-search-label ml-2 hidden text-sm font-medium">Search</span>
        </button>

        <MotionToggle className="hidden h-10 w-10 shrink-0 min-[420px]:inline-flex" />
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
              className="absolute right-0 top-full z-[90] mt-2 isolate max-h-[min(70vh,28rem)] w-[min(16rem,calc(100vw-1rem))] max-w-[calc(100dvw-1rem)] overflow-hidden rounded-2xl border border-border/90 bg-card/96 py-1 text-left shadow-[0_28px_70px_-34px_hsl(var(--primary)/0.58),0_18px_42px_-24px_hsl(var(--foreground)/0.42)] animate-in fade-in slide-in-from-top-1 duration-150"
            >
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 rounded-[inherit] bg-[linear-gradient(180deg,hsl(var(--card)/0.96),hsl(var(--card)/0.92))] backdrop-blur-3xl backdrop-saturate-150"
              />
              <div className="relative z-10 mb-1 border-b border-border/90 bg-card/72 px-2.5 py-2.5">
                <p className="text-sm font-medium truncate">{user.name}</p>
                <p className="text-xs text-muted-foreground truncate">{user.email}</p>
              </div>
              <div className="relative z-10">
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
                {trip?.canManage ? (
                  <MenuItem
                    as="button"
                    onClick={() => {
                      setMenuOpen(false);
                      void handleRenameTrip();
                    }}
                    icon={<Pencil className="w-3.5 h-3.5" />}
                    label="Rename trip"
                  />
                ) : null}
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
                <div className="my-1 border-t border-border/90" />
                <button
                  role="menuitem"
                  onClick={handleSignOut}
                  className="flex w-full items-center gap-2 px-2.5 py-2 text-left text-sm text-destructive transition-colors hover:bg-destructive/10"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span>Sign out</span>
                </button>
              </div>
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
