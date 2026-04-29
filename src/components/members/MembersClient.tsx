"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { staggerContainer, listItem } from "@/lib/motion";
import { PageHeader } from "@/components/shared/PageHeader";
import { MemberCard } from "./MemberCard";
import { InviteDialog } from "./InviteDialog";
import { RoleBadge } from "./RoleBadge";
import { bulkRevokeInvites, revokeInvite } from "@/actions/members";
import { useTripContext } from "@/components/trip/TripContext";
import { toast } from "sonner";
import { toastBulkUndo, toastWithUndo } from "@/lib/undo-toast";
import { UserPlus, Clock, Copy, X } from "lucide-react";
import { MemberRole } from "@prisma/client";
import { ROUTES } from "@/lib/constants";
import { formatDate } from "@/lib/utils";

interface MembersClientProps {
  tripId: string;
  members: {
    id: string;
    userId: string;
    role: MemberRole;
    joinedAt: string;
    user: { id: string; name: string; email: string; avatarUrl: string | null };
  }[];
  pendingInvites: {
    id: string;
    email: string;
    role: MemberRole;
    token: string;
    expiresAt: string | null;
    senderName: string;
  }[];
}

export function MembersClient({ tripId, members, pendingInvites }: MembersClientProps) {
  const { canManage } = useTripContext();
  const [inviteOpen, setInviteOpen] = useState(false);
  const [pickedInvites, setPickedInvites] = useState<string[]>([]);

  function togglePickInvite(id: string) {
    setPickedInvites((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  async function handleRevoke(inviteId: string) {
    try {
      const res = await revokeInvite(inviteId);
      setPickedInvites((prev) => prev.filter((x) => x !== inviteId));
      toastWithUndo("Invite revoked", res.undoTokenId);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not revoke this invite. Please try again.");
    }
  }

  async function revokePickedInvites() {
    if (pickedInvites.length === 0) return;
    try {
      const ids = [...pickedInvites];
      const res = await bulkRevokeInvites(tripId, ids);
      setPickedInvites([]);
      toastBulkUndo(`${ids.length} invite${ids.length === 1 ? "" : "s"} revoked`, res.undoTokenIds);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not revoke invites.");
    }
  }

  async function copyInviteLink(invite: MembersClientProps["pendingInvites"][number]) {
    try {
      const origin = typeof window !== "undefined" ? window.location.origin : "";
      await navigator.clipboard.writeText(`${origin}${ROUTES.invite(invite.token)}`);
      toast.success("Invite link copied", {
        description: `${invite.email || "Pending invite"} can join as ${invite.role.toLowerCase()}.`,
      });
    } catch {
      toast.error("Could not copy the invite link. Please try again.");
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="Crew access"
        title="Members"
        description={`${members.length} member${members.length !== 1 ? "s" : ""} in this trip`}
        actions={
          canManage && (
            <button
              onClick={() => setInviteOpen(true)}
              className="app-hover-lift flex items-center gap-2 bg-primary text-primary-foreground rounded-xl px-4 py-2 text-sm font-semibold hover:bg-primary/90 transition-colors"
            >
              <UserPlus className="w-4 h-4" />
              Invite
            </button>
          )
        }
      />

      <motion.div
        variants={staggerContainer}
        initial="initial"
        animate="animate"
        className="space-y-3"
      >
        {members.map((member) => (
          <motion.div key={member.id} variants={listItem}>
            <MemberCard member={member} tripId={tripId} />
          </motion.div>
        ))}
      </motion.div>

      {pendingInvites.length > 0 && (
        <div className="mt-8">
          <div className="mb-4 flex flex-col gap-3 min-[560px]:flex-row min-[560px]:items-center min-[560px]:justify-between">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Pending invites
          </h3>
          {pickedInvites.length > 0 && canManage ? (
            <div className="flex w-full flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-[hsl(var(--card)/0.96)] px-4 py-3 shadow-md backdrop-blur-md min-[560px]:w-auto md:bg-card/92">
              <span className="text-sm font-medium">{pickedInvites.length} invite{pickedInvites.length === 1 ? "" : "s"} selected</span>
              <button
                type="button"
                onClick={() => void revokePickedInvites()}
                className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-destructive px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-destructive/90"
              >
                Revoke all
              </button>
            </div>
          ) : null}
          </div>
          <div className="space-y-2">
            {pendingInvites.map((invite) => (
              <div
                key={invite.id}
                className="app-glass flex items-center gap-3 rounded-xl border-dashed px-4 py-3"
              >
                {canManage ? (
                  <input
                    type="checkbox"
                    checked={pickedInvites.includes(invite.id)}
                    onChange={() => togglePickInvite(invite.id)}
                    className="h-4 w-4 shrink-0 rounded border-input self-center"
                    aria-label={`Select invite for ${invite.email}`}
                  />
                ) : null}
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                </div>
                <button
                  type="button"
                  onClick={() => void copyInviteLink(invite)}
                  title="Copy invite link"
                  aria-label={`Copy invite link for ${invite.email || "pending invite"}`}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border/70 bg-card/80 text-muted-foreground transition-[background-color,border-color,color,box-shadow] duration-300 hover:border-primary/35 hover:bg-primary/10 hover:text-primary hover:shadow-[0_0_24px_hsl(var(--primary)/0.16)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <Copy className="h-4 w-4" />
                </button>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{invite.email}</p>
                  <p className="text-xs text-muted-foreground">
                    Invited by {invite.senderName}
                    {invite.expiresAt && ` · expires ${formatDate(invite.expiresAt)}`}
                  </p>
                </div>
                <RoleBadge role={invite.role} />
                {canManage && (
                  <button
                    onClick={() => handleRevoke(invite.id)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <InviteDialog open={inviteOpen} onOpenChange={setInviteOpen} tripId={tripId} />
    </>
  );
}
