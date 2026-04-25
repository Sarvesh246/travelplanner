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
    <div className="min-h-screen bg-background">
      <header className="mx-auto flex min-h-14 max-w-6xl items-center justify-between gap-2 px-4 sm:px-6">
        <Link href="/" className="flex min-w-0 items-center gap-2">
          <BeaconLogo className="h-8 w-8 shrink-0" gradientId="beaconGradient-landing" />
          <span className="truncate font-sans text-base font-semibold tracking-tight sm:text-lg">Beacon</span>
        </Link>
        <nav className="flex shrink-0 items-center gap-1.5 min-[400px]:gap-3">
          <Link
            href={ROUTES.login}
            className="min-h-10 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors hover:bg-muted min-[400px]:px-4"
          >
            Log in
          </Link>
          <Link
            href={ROUTES.signup}
            className="min-h-10 rounded-lg bg-primary px-2.5 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 min-[400px]:px-4"
          >
            Sign up
          </Link>
        </nav>
      </header>

      <main>
        {/* Hero */}
        <section className="mx-auto max-w-4xl px-4 pb-20 pt-12 text-center min-[400px]:px-6 min-[400px]:pb-24 min-[400px]:pt-16 sm:px-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground mb-6">
            <Sparkles className="w-3 h-3 text-primary" />
            One workspace for the whole crew
          </div>
          <h1 className="text-balance font-sans text-3xl font-semibold tracking-tight text-foreground min-[400px]:text-4xl sm:text-6xl">
            Plan trips <span className="gradient-text">together</span>,
            <br />
            not in 10 different apps.
          </h1>
          <p className="text-lg text-muted-foreground mt-5 max-w-xl mx-auto text-balance">
            Itinerary, supplies, expenses, and votes — collaborative from day one. Stop
            juggling docs, spreadsheets, and group chats.
          </p>
          <div className="mt-8 flex w-full max-w-md flex-col items-stretch justify-center gap-3 min-[480px]:max-w-none min-[480px]:flex-row min-[480px]:items-center min-[480px]:justify-center">
            <Link
              href={ROUTES.signup}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Start planning free <ArrowRight className="h-4 w-4 shrink-0" />
            </Link>
            <Link
              href={ROUTES.login}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-border px-4 py-3 text-center text-sm font-semibold transition-colors hover:bg-muted min-[480px]:px-5"
            >
              I already have an account
            </Link>
          </div>
        </section>

        {/* Feature grid */}
        <section className="mx-auto max-w-5xl px-4 pb-20 min-[400px]:px-6 min-[400px]:pb-24 sm:px-6">
          <div className="grid md:grid-cols-2 gap-5">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="bg-card border border-border rounded-2xl p-6 hover:border-border/80 hover:shadow-sm transition-all"
              >
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-4 ${f.color}`}>
                  <f.icon className="w-5 h-5" />
                </div>
                <h3 className="font-semibold text-lg mb-1">{f.title}</h3>
                <p className="text-sm text-muted-foreground">{f.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Perks */}
        <section className="mx-auto max-w-3xl px-4 pb-20 min-[400px]:px-6 min-[400px]:pb-24 sm:px-6">
          <div className="bg-gradient-to-br from-primary/10 via-secondary/15 to-accent/30 border border-primary/20 rounded-3xl p-8 sm:p-12">
            <div className="flex items-center gap-2 text-primary font-semibold text-sm mb-4">
              <Users className="w-4 h-4" /> Built for groups
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold mb-6 text-balance">
              Everything your crew needs to go from idea to boarding pass.
            </h2>
            <ul className="grid sm:grid-cols-2 gap-3">
              {PERKS.map((perk) => (
                <li key={perk} className="flex items-start gap-2 text-sm">
                  <div className="w-5 h-5 rounded-full bg-success/15 flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="w-3 h-3 text-success" />
                  </div>
                  {perk}
                </li>
              ))}
            </ul>
            <div className="mt-8">
              <Link
                href={ROUTES.signup}
                className="inline-flex items-center gap-2 bg-primary text-primary-foreground rounded-xl px-5 py-3 text-sm font-semibold hover:bg-primary/90 transition-colors"
              >
                Create your first trip <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-6 text-xs text-muted-foreground min-[400px]:flex-row min-[400px]:px-6 min-[400px]:text-left">
          <p>© {new Date().getFullYear()} Beacon</p>
          <div className="flex min-h-10 items-center gap-6">
            <Link href={ROUTES.login} className="transition-colors hover:text-foreground">
              Log in
            </Link>
            <Link href={ROUTES.signup} className="transition-colors hover:text-foreground">
              Sign up
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
