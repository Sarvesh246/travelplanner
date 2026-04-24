import { cn } from "@/lib/utils";
import { MEMBER_ROLES } from "@/lib/constants";
import { MemberRole } from "@prisma/client";

interface RoleBadgeProps {
  role: MemberRole;
  size?: "sm" | "md";
}

export function RoleBadge({ role, size = "sm" }: RoleBadgeProps) {
  const config = MEMBER_ROLES[role];
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full font-medium",
        size === "sm" ? "px-2 py-0.5 text-xs" : "px-2.5 py-1 text-xs",
        config.color
      )}
    >
      {config.label}
    </span>
  );
}
