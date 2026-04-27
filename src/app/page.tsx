import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ROUTES } from "@/lib/constants";
import { LandingExperience } from "@/components/landing/LandingExperience";

export const metadata = { title: "Beacon - Plan trips together, split costs fairly" };

export default async function LandingPage() {
  // If Supabase is not configured yet, render the marketing page instead of crashing.
  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    try {
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) redirect(ROUTES.dashboard);
    } catch (err) {
      const digest = (err as { digest?: string } | null)?.digest;
      if (digest?.startsWith("NEXT_REDIRECT")) throw err;
    }
  }

  return <LandingExperience />;
}
