import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { TopNav } from "@/components/layout/TopNav";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  let dbUser: { name: string; email: string; avatarUrl: string | null } | null = null;
  try {
    dbUser = await prisma.user.findUnique({
      where: { externalId: user.id },
      select: { name: true, email: true, avatarUrl: true },
    });
  } catch (e) {
    // Avoid console.error here: in dev it is forwarded to the browser overlay even though we recover below.
    console.warn("[dashboard/layout] Prisma user lookup failed:", e);
  }

  const profile = dbUser ?? {
    name: user.user_metadata?.name || user.email?.split("@")[0] || "Traveler",
    email: user.email ?? "",
    avatarUrl: user.user_metadata?.avatar_url ?? null,
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <TopNav user={profile} />
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-8">{children}</main>
    </div>
  );
}
