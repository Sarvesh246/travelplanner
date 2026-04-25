"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { staggerContainer, listItem } from "@/lib/motion";
import { PageHeader } from "@/components/shared/PageHeader";
import { MemberCard } from "./MemberCard";
import { InviteDialog } from "./InviteDialog";
import { RoleBadge } from "./RoleBadge";
import { revokeInvite } from "@/actions/members";
import { useTripContext } from "@/components/trip/TripContext";
import { toast } from "sonner";
import { UserPlus, Clock, X } from "lucide-react";
import { MemberRole } from "@prisma/client";
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
    expiresAt: string | null;
    senderName: string;
  }[];
}

export function MembersClient({ tripId, members, pendingInvites }: MembersClientProps) {
  const { canManage } = useTripContext();
  const [inviteOpen, setInviteOpen] = useState(false);

  async function handleRevoke(inviteId: string) {
    try {
      await revokeInvite(inviteId);
      toast.success("Invite revoked");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    }
  }

  return (
    <>
      <PageHeader
        title="Members"
        description={`${members.length} member${members.length !== 1 ? "s" : ""} in this trip`}
        actions={
          canManage && (
            <button
              onClick={() => setInviteOpen(true)}
              className="flex items-center gap-2 bg-primary text-primary-foreground rounded-xl px-4 py-2 text-sm font-semibold hover:bg-primary/90 transition-colors"
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
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
            Pending invites
          </h3>
          <div className="space-y-2">
            {pendingInvites.map((invite) => (
              <div
                key={invite.id}
                className="flex items-center gap-3 py-3 px-4 bg-card border border-border border-dashed rounded-xl"
              >
                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                </div>
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
