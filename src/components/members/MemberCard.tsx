"use client";

import { useState } from "react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { UserAvatar } from "@/components/shared/UserAvatar";
import { RoleBadge } from "./RoleBadge";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { MoreHorizontal, UserMinus, Shield, User, Eye } from "lucide-react";
import { removeMember, updateMemberRole } from "@/actions/members";
import { useTripContext } from "@/components/trip/TripContext";
import { toast } from "sonner";
import { MemberRole } from "@prisma/client";
import { cn } from "@/lib/utils";

interface MemberCardProps {
  member: {
    id: string;
    userId: string;
    role: MemberRole;
    user: { id: string; name: string; email: string; avatarUrl: string | null };
  };
  tripId: string;
}

const itemCls =
  "flex cursor-default select-none items-center gap-2 rounded-lg px-3 py-2 text-sm outline-none data-[highlighted]:bg-muted data-[disabled]:pointer-events-none data-[disabled]:opacity-50";

export function MemberCard({ member, tripId }: MemberCardProps) {
  const { currentUser, canManage } = useTripContext();
  const [confirmRemove, setConfirmRemove] = useState(false);
  const isMe = member.userId === currentUser.id;
  const isOwnerMember = member.role === "OWNER";

  async function handleRoleChange(role: MemberRole) {
    try {
      await updateMemberRole(tripId, member.userId, role);
      toast.success("Role updated");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not update this role. Please try again.");
    }
  }

  async function handleRemove() {
    try {
      await removeMember(tripId, member.userId);
      toast.success(`${member.user.name} removed`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not remove this member. Please try again.");
    }
  }

  return (
    <>
      <div
        className={cn(
          "app-surface app-hover-lift flex items-center gap-3 rounded-xl px-4 py-3",
          "!overflow-visible"
        )}
      >
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
          <div
            className="shrink-0"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
          >
            <DropdownMenu.Root>
              <DropdownMenu.Trigger asChild>
                <button
                  type="button"
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors"
                  aria-label="Member actions"
                >
                  <MoreHorizontal className="w-4 h-4" />
                </button>
              </DropdownMenu.Trigger>
              <DropdownMenu.Portal>
                <DropdownMenu.Content
                  className="z-[120] min-w-[12rem] overflow-hidden rounded-xl border border-border bg-popover py-1 text-popover-foreground shadow-lg"
                  sideOffset={8}
                  align="end"
                  collisionPadding={12}
                  onCloseAutoFocus={(e) => e.preventDefault()}
                >
                  {canManage && member.role !== "ADMIN" && (
                    <DropdownMenu.Item className={itemCls} onSelect={() => handleRoleChange("ADMIN")}>
                      <Shield className="w-3.5 h-3.5 shrink-0" /> Make admin
                    </DropdownMenu.Item>
                  )}
                  {canManage && member.role !== "MEMBER" && (
                    <DropdownMenu.Item className={itemCls} onSelect={() => handleRoleChange("MEMBER")}>
                      <User className="w-3.5 h-3.5 shrink-0" /> Make member
                    </DropdownMenu.Item>
                  )}
                  {canManage && member.role !== "VIEWER" && (
                    <DropdownMenu.Item className={itemCls} onSelect={() => handleRoleChange("VIEWER")}>
                      <Eye className="w-3.5 h-3.5 shrink-0" /> Make viewer
                    </DropdownMenu.Item>
                  )}
                  <DropdownMenu.Item
                    className={cn(itemCls, "text-destructive data-[highlighted]:bg-destructive/10")}
                    onSelect={() => setConfirmRemove(true)}
                  >
                    <UserMinus className="w-3.5 h-3.5 shrink-0" /> Remove
                  </DropdownMenu.Item>
                </DropdownMenu.Content>
              </DropdownMenu.Portal>
            </DropdownMenu.Root>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={confirmRemove}
        onOpenChange={setConfirmRemove}
        title={`Remove ${member.user.name}?`}
        description={"They'll lose access to this trip immediately."}
        confirmLabel="Remove"
        onConfirm={handleRemove}
      />
    </>
  );
}
