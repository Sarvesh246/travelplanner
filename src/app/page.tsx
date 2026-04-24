import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Plane,
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

export const metadata = { title: "Groovy – Plan trips together" };

const FEATURES = [
  {
    icon: Map,
    title: "Multi-stop itinerary",
    description:
      "Plan every stop, stay, and activity on a collaborative timeline that stays in sync.",
    color: "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400",
  },
  {
    icon: Package,
    title: "Supply tracker",
    description:
      "Assign who brings what. Track quantities, costs, and packing progress in real time.",
    color: "bg-pink-100 text-pink-600 dark:bg-pink-900/30 dark:text-pink-400",
  },
  {
    icon: Receipt,
    title: "Smart expense splits",
    description:
      "Equal, weighted, or custom splits. Balance summary simplifies who owes whom.",
    color: "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400",
  },
  {
    icon: Vote,
    title: "Group voting",
    description:
      "Poll your crew on dates, destinations, and activities. Watch decisions animate in.",
    color: "bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400",
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
      <header className="h-14 flex items-center justify-between px-6 max-w-6xl mx-auto">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <Plane className="w-4 h-4 text-white rotate-45" />
          </div>
          <span className="font-bold text-lg tracking-tight">Groovy</span>
        </Link>
        <nav className="flex items-center gap-3">
          <Link
            href={ROUTES.login}
            className="text-sm font-medium px-4 py-2 rounded-lg hover:bg-muted transition-colors"
          >
            Log in
          </Link>
          <Link
            href={ROUTES.signup}
            className="text-sm font-semibold px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Sign up
          </Link>
        </nav>
      </header>

      <main>
        {/* Hero */}
        <section className="max-w-4xl mx-auto px-6 pt-16 pb-24 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground mb-6">
            <Sparkles className="w-3 h-3 text-primary" />
            One workspace for the whole crew
          </div>
          <h1 className="text-4xl sm:text-6xl font-bold tracking-tight text-balance">
            Plan trips <span className="gradient-text">together</span>,
            <br />
            not in 10 different apps.
          </h1>
          <p className="text-lg text-muted-foreground mt-5 max-w-xl mx-auto text-balance">
            Itinerary, supplies, expenses, and votes — collaborative from day one. Stop
            juggling docs, spreadsheets, and group chats.
          </p>
          <div className="flex items-center justify-center gap-3 mt-8">
            <Link
              href={ROUTES.signup}
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground rounded-xl px-5 py-3 text-sm font-semibold hover:bg-primary/90 transition-colors"
            >
              Start planning free <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href={ROUTES.login}
              className="inline-flex items-center gap-2 border border-border rounded-xl px-5 py-3 text-sm font-semibold hover:bg-muted transition-colors"
            >
              I already have an account
            </Link>
          </div>
        </section>

        {/* Feature grid */}
        <section className="max-w-5xl mx-auto px-6 pb-24">
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
        <section className="max-w-3xl mx-auto px-6 pb-24">
          <div className="bg-gradient-to-br from-primary/10 via-violet-500/10 to-accent/10 border border-primary/20 rounded-3xl p-8 sm:p-12">
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
        <div className="max-w-6xl mx-auto px-6 py-6 flex items-center justify-between text-xs text-muted-foreground">
          <p>© {new Date().getFullYear()} Groovy Trip Planner</p>
          <div className="flex items-center gap-4">
            <Link href={ROUTES.login} className="hover:text-foreground transition-colors">Log in</Link>
            <Link href={ROUTES.signup} className="hover:text-foreground transition-colors">Sign up</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
