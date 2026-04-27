"use client";

import { useState } from "react";
import { UserAvatar } from "@/components/shared/UserAvatar";
import { RoleBadge } from "./RoleBadge";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { MoreHorizontal, UserMinus, Shield, User, Eye } from "lucide-react";
import { removeMember, updateMemberRole } from "@/actions/members";
import { useTripContext } from "@/components/trip/TripContext";
import { toast } from "sonner";
import { MemberRole } from "@prisma/client";

interface MemberCardProps {
  member: {
    id: string;
    userId: string;
    role: MemberRole;
    user: { id: string; name: string; email: string; avatarUrl: string | null };
  };
  tripId: string;
}

export function MemberCard({ member, tripId }: MemberCardProps) {
  const { currentUser, canManage } = useTripContext();
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(false);
  const isMe = member.userId === currentUser.id;
  const isOwnerMember = member.role === "OWNER";

  async function handleRoleChange(role: MemberRole) {
    setMenuOpen(false);
    try {
      await updateMemberRole(tripId, member.userId, role);
      toast.success("Role updated");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update role");
    }
  }

  async function handleRemove() {
    try {
      await removeMember(tripId, member.userId);
      toast.success(`${member.user.name} removed`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to remove member");
    }
  }

  return (
    <>
      <div className="app-surface app-hover-lift flex items-center gap-3 rounded-xl px-4 py-3">
        <UserAvatar name={member.user.name} avatarUrl={member.user.avatarUrl} size="md" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-medium text-sm truncate">{member.user.name}</p>
            {isMe && <span className="text-xs text-muted-foreground">(you)</span>}
          </div>
          <p className="text-xs text-muted-foreground truncate">{member.user.email}</p>
        </div>
        <RoleBadge role={member.role} />
        {canManage && !isMe && !isOwnerMember && (
          <div className="relative">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-full mt-1 w-48 bg-popover border border-border rounded-xl shadow-lg py-1 z-20">
                {canManage && member.role !== "ADMIN" && (
                  <button
                    onClick={() => handleRoleChange("ADMIN")}
                    className="w-full text-left px-3 py-2 text-sm flex items-center gap-2 hover:bg-muted transition-colors"
                  >
                    <Shield className="w-3.5 h-3.5" /> Make Admin
                  </button>
                )}
                {canManage && member.role !== "MEMBER" && (
                  <button
                    onClick={() => handleRoleChange("MEMBER")}
                    className="w-full text-left px-3 py-2 text-sm flex items-center gap-2 hover:bg-muted transition-colors"
                  >
                    <User className="w-3.5 h-3.5" /> Make Member
                  </button>
                )}
                {canManage && member.role !== "VIEWER" && (
                  <button
                    onClick={() => handleRoleChange("VIEWER")}
                    className="w-full text-left px-3 py-2 text-sm flex items-center gap-2 hover:bg-muted transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5" /> Make Viewer
                  </button>
                )}
                <button
                  onClick={() => { setMenuOpen(false); setConfirmRemove(true); }}
                  className="w-full text-left px-3 py-2 text-sm flex items-center gap-2 text-destructive hover:bg-destructive/10 transition-colors"
                >
                  <UserMinus className="w-3.5 h-3.5" /> Remove
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <ConfirmDialog
        open={confirmRemove}
        onOpenChange={setConfirmRemove}
        title={`Remove ${member.user.name}?`}
        description="They'll lose access to this trip immediately."
        confirmLabel="Remove"
        onConfirm={handleRemove}
      />
    </>
  );
}
