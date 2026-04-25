"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { acceptInvite } from "@/actions/members";
import { ROUTES } from "@/lib/constants";

interface AcceptInviteButtonProps {
  token: string;
  tripId: string;
}

export function AcceptInviteButton({ token, tripId }: AcceptInviteButtonProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function handleClick() {
    startTransition(async () => {
      try {
        await acceptInvite(token);
        toast.success("You're in. Welcome aboard!");
        router.push(ROUTES.tripOverview(tripId));
        router.refresh();
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : "Couldn't accept this invite"
        );
      }
    });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      className="mt-2 inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-70"
    >
      {pending ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <UserPlus className="h-4 w-4" />
      )}
      {pending ? "Joining…" : "Accept invite"}
    </button>
  );
}
