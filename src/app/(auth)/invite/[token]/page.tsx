import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { AlertCircle, CheckCircle2, UserPlus } from "lucide-react";
import { acceptInvite } from "@/actions/members";
import { ROUTES } from "@/lib/constants";
import { formatDate } from "@/lib/utils";

export const metadata = { title: "Accept invite" };

export default async function InvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  const invite = await prisma.tripInvite.findUnique({
    where: { token },
    include: {
      trip: { select: { id: true, name: true, coverImageUrl: true, description: true } },
      sender: { select: { name: true } },
    },
  });

  if (!invite) {
    return <InviteMessage tone="error" title="Invite not found" description="This invite link isn't valid. It may have been removed." />;
  }

  if (invite.status !== "PENDING") {
    return (
      <InviteMessage
        tone="error"
        title="Invite unavailable"
        description={
          invite.status === "ACCEPTED"
            ? "This invite has already been accepted."
            : invite.status === "EXPIRED" || (invite.expiresAt && invite.expiresAt < new Date())
              ? "This invite has expired."
              : invite.status === "REVOKED"
                ? "This invite has been revoked by the trip owner."
                : "This invite is no longer active."
        }
      />
    );
  }

  if (invite.expiresAt && invite.expiresAt < new Date()) {
    return (
      <InviteMessage
        tone="error"
        title="Invite expired"
        description={`This invite expired on ${formatDate(invite.expiresAt)}.`}
      />
    );
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?next=${encodeURIComponent(`/invite/${token}`)}`);
  }

  const dbUser = await prisma.user.findUnique({ where: { externalId: user.id } });
  if (!dbUser) {
    redirect(`/login?next=${encodeURIComponent(`/invite/${token}`)}`);
  }

  // Accept and redirect
  try {
    const result = await acceptInvite(token);
    redirect(ROUTES.tripOverview(result.tripId));
  } catch (err) {
    // Re-throw Next.js redirect signals so routing proceeds.
    const digest = (err as { digest?: string } | null)?.digest;
    if (digest?.startsWith("NEXT_REDIRECT")) throw err;
    return (
      <InviteMessage
        tone="error"
        title="Couldn't accept invite"
        description={err instanceof Error ? err.message : "An unexpected error occurred."}
      />
    );
  }
}

function InviteMessage({
  tone,
  title,
  description,
}: {
  tone: "success" | "error";
  title: string;
  description: string;
}) {
  const Icon = tone === "success" ? CheckCircle2 : AlertCircle;
  const iconClass = tone === "success" ? "text-success" : "text-destructive";

  return (
    <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
      <div className="flex flex-col items-center text-center gap-3">
        <div className={`w-12 h-12 rounded-full bg-muted flex items-center justify-center ${iconClass}`}>
          <Icon className="w-6 h-6" />
        </div>
        <h2 className="font-semibold text-lg">{title}</h2>
        <p className="text-sm text-muted-foreground">{description}</p>
        <Link
          href={ROUTES.dashboard}
          className="mt-2 inline-flex items-center gap-2 bg-primary text-primary-foreground rounded-lg px-4 py-2 text-sm font-semibold hover:bg-primary/90 transition-colors"
        >
          <UserPlus className="w-4 h-4" /> Go to dashboard
        </Link>
      </div>
    </div>
  );
}
