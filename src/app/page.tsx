import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Map,
  Package,
  Receipt,
  Vote,
  ArrowRight,
  Check,
  Users,
  Sparkles,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { ROUTES } from "@/lib/constants";
import { BeaconLogo } from "@/components/shared/BeaconLogo";
import { MotionToggle } from "@/components/shared/MotionToggle";

export const metadata = { title: "Beacon – Plan trips together, split costs fairly" };

const FEATURES = [
  {
    icon: Map,
    title: "Multi-stop itinerary",
    description:
      "Plan every stop, stay, and activity on a collaborative timeline that stays in sync.",
    color:
      "bg-[hsl(110,25%,90%)] text-[hsl(124,32%,28%)] dark:bg-[hsl(124,28%,18%)] dark:text-[hsl(110,32%,60%)]",
  },
  {
    icon: Package,
    title: "Supply tracker",
    description:
      "Assign who brings what. Track quantities, costs, and packing progress in real time.",
    color:
      "bg-[hsl(112,30%,90%)] text-[hsl(120,30%,30%)] dark:bg-[hsl(112,28%,20%)] dark:text-[hsl(112,30%,70%)]",
  },
  {
    icon: Receipt,
    title: "Smart expense splits",
    description:
      "Equal, weighted, or custom splits. Balance summary simplifies who owes whom.",
    color:
      "bg-[hsl(51,45%,88%)] text-[hsl(128,32%,28%)] dark:bg-[hsl(50,25%,18%)] dark:text-[hsl(51,45%,78%)]",
  },
  {
    icon: Vote,
    title: "Group voting",
    description:
      "Poll your crew on dates, destinations, and activities. Watch decisions animate in.",
    color:
      "bg-[hsl(124,22%,88%)] text-[hsl(124,35%,26%)] dark:bg-[hsl(128,30%,16%)] dark:text-[hsl(110,28%,58%)]",
  },
];

const PERKS = [
  "Invite members by email or shareable link",
  "Role-aware editing (owner, admin, member)",
  "Dark mode & responsive on every device",
  "Optimistic UI — changes feel instant",
];

export default async function LandingPage() {
  // If Supabase isn't configured yet (missing env vars), just render the marketing
  // page instead of crashing.
  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    try {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) redirect(ROUTES.dashboard);
    } catch (err) {
      // Re-throw Next.js redirect signals; swallow anything else so the landing
      // page still renders for unauthenticated visitors.
      const digest = (err as { digest?: string } | null)?.digest;
      if (digest?.startsWith("NEXT_REDIRECT")) throw err;
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      {/* Ambient depth layers — pure decoration, behind everything */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="landing-grid" />
        <div className="landing-orb landing-orb--primary" />
        <div className="landing-orb landing-orb--secondary" />
        <div className="landing-orb landing-orb--tertiary" />
      </div>

      <header className="relative z-10 mx-auto flex min-h-16 max-w-6xl items-center justify-between gap-2 px-4 sm:px-6">
        <Link href="/" className="flex min-w-0 items-center gap-2">
          <BeaconLogo className="h-8 w-8 shrink-0" gradientId="beaconGradient-landing" />
          <span className="truncate font-sans text-base font-semibold tracking-tight sm:text-lg">Beacon</span>
        </Link>
        <nav className="flex shrink-0 items-center gap-1.5 min-[400px]:gap-3">
          <Link
            href={ROUTES.login}
            className="inline-flex min-h-10 items-center justify-center rounded-lg px-2.5 py-2 text-sm font-medium transition-colors hover:bg-muted min-[400px]:px-4"
          >
            Log in
          </Link>
          <Link
            href={ROUTES.signup}
            className="landing-cta inline-flex min-h-10 items-center rounded-lg bg-primary px-2.5 py-2 text-sm font-semibold text-primary-foreground min-[400px]:px-4"
          >
            Sign up
          </Link>
        </nav>
      </header>

      <main className="relative z-10">
        {/* Hero */}
        <section className="mx-auto max-w-4xl px-4 pb-24 pt-16 text-center min-[400px]:px-6 min-[400px]:pb-28 min-[400px]:pt-20 sm:px-6">
          <div className="landing-fade-up landing-stagger-1 mb-7 inline-flex items-center gap-2 rounded-full border border-border bg-card/70 px-3.5 py-1.5 text-xs font-medium text-muted-foreground shadow-[0_1px_0_0_hsl(var(--foreground)/0.04)] backdrop-blur">
            <span className="landing-badge-dot inline-flex h-1.5 w-1.5 rounded-full bg-primary" />
            <Sparkles className="h-3 w-3 text-primary" />
            One workspace for the whole crew
          </div>
          <h1 className="landing-fade-up landing-stagger-2 text-balance font-sans text-3xl font-semibold tracking-tight text-foreground min-[400px]:text-4xl sm:text-6xl">
            Plan trips <span className="gradient-text">together</span>,
            <br />
            not in 10 different apps.
          </h1>
          <p className="landing-fade-up landing-stagger-3 mx-auto mt-6 max-w-xl text-balance text-lg text-muted-foreground">
            Itinerary, supplies, expenses, and votes — collaborative from day one. Stop
            juggling docs, spreadsheets, and group chats.
          </p>
          <div className="landing-fade-up landing-stagger-4 mx-auto mt-9 flex w-full max-w-md flex-col items-stretch justify-center gap-3 sm:max-w-none sm:flex-row sm:items-center">
            <Link
              href={ROUTES.signup}
              className="landing-cta inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground"
            >
              Start planning free <ArrowRight className="h-4 w-4 shrink-0" />
            </Link>
            <Link
              href={ROUTES.login}
              className="landing-cta-ghost inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-border bg-card/50 px-6 py-3 text-center text-sm font-semibold backdrop-blur transition-colors hover:bg-muted"
            >
              I already have an account
            </Link>
          </div>

          {/* Trust line */}
          <div className="landing-fade-up landing-stagger-5 mt-8 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-success" /> Free to start
            </span>
            <span className="hidden h-3 w-px bg-border min-[400px]:inline-block" />
            <span>No credit card required</span>
            <span className="hidden h-3 w-px bg-border min-[400px]:inline-block" />
            <span>Built for groups of 2–50</span>
          </div>
        </section>

        {/* Feature grid */}
        <section className="mx-auto max-w-5xl px-4 pb-24 min-[400px]:px-6 min-[400px]:pb-28 sm:px-6">
          <div className="grid gap-5 md:grid-cols-2">
            {FEATURES.map((f, i) => (
              <div
                key={f.title}
                className={`landing-card landing-fade-up landing-stagger-${(i % 4) + 1} rounded-2xl border border-border bg-card/80 p-6 backdrop-blur`}
              >
                <div
                  className={`landing-card__icon mb-5 flex h-12 w-12 items-center justify-center rounded-xl ${f.color}`}
                >
                  <f.icon className="h-5 w-5" />
                </div>
                <h3 className="mb-1.5 text-lg font-semibold tracking-tight">{f.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{f.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Perks */}
        <section className="mx-auto max-w-3xl px-4 pb-24 min-[400px]:px-6 min-[400px]:pb-28 sm:px-6">
          <div className="relative overflow-hidden rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/10 via-secondary/15 to-accent/30 p-8 shadow-[0_30px_60px_-30px_hsl(var(--primary)/0.35)] sm:p-12">
            {/* Soft inner glow */}
            <div
              aria-hidden
              className="pointer-events-none absolute -top-24 -right-24 h-64 w-64 rounded-full bg-primary/20 blur-3xl"
            />
            <div className="relative">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/25 bg-card/60 px-3 py-1 text-sm font-semibold text-primary backdrop-blur">
                <Users className="h-4 w-4" /> Built for groups
              </div>
              <h2 className="mb-7 text-balance text-2xl font-bold tracking-tight sm:text-3xl">
                Everything your crew needs to go from idea to boarding pass.
              </h2>
              <ul className="grid gap-3 sm:grid-cols-2">
                {PERKS.map((perk) => (
                  <li
                    key={perk}
                    className="flex items-start gap-2.5 rounded-xl border border-transparent p-2 text-sm transition-colors hover:border-border/60 hover:bg-card/60"
                  >
                    <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-success/15 ring-1 ring-success/30">
                      <Check className="h-3 w-3 text-success" />
                    </div>
                    {perk}
                  </li>
                ))}
              </ul>
              <div className="mt-9">
                <Link
                  href={ROUTES.signup}
                  className="landing-cta inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground"
                >
                  Create your first trip <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="relative z-10 border-t border-border/70 bg-background/60 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-6 text-xs text-muted-foreground min-[400px]:flex-row min-[400px]:px-6 min-[400px]:text-left">
          <p>© {new Date().getFullYear()} Beacon</p>
          <div className="flex min-h-10 items-center gap-5">
            <Link href={ROUTES.login} className="transition-colors hover:text-foreground">
              Log in
            </Link>
            <Link href={ROUTES.signup} className="transition-colors hover:text-foreground">
              Sign up
            </Link>
            <span className="hidden h-3 w-px bg-border min-[400px]:inline-block" />
            <MotionToggle variant="text" />
          </div>
        </div>
      </footer>
    </div>
  );
}
