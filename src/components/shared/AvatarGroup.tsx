import { UserAvatar } from "./UserAvatar";
import { cn } from "@/lib/utils";

interface AvatarGroupProps {
  users: { id: string; name: string; avatarUrl?: string | null }[];
  maxVisible?: number;
  size?: "xs" | "sm" | "md";
  className?: string;
}

export function AvatarGroup({ users, maxVisible = 4, size = "sm", className }: AvatarGroupProps) {
  const visible = users.slice(0, maxVisible);
  const remaining = users.length - maxVisible;

  const overlapClass = size === "xs" ? "-ml-1.5" : size === "sm" ? "-ml-2" : "-ml-3";

  return (
    <div className={cn("flex items-center", className)}>
      {visible.map((user, i) => (
        <div key={user.id} className={cn(i > 0 && overlapClass)} style={{ zIndex: visible.length - i }}>
          <UserAvatar name={user.name} avatarUrl={user.avatarUrl} size={size} />
        </div>
      ))}
      {remaining > 0 && (
        <div
          className={cn(
            overlapClass,
            "rounded-full bg-muted border-2 border-background flex items-center justify-center text-xs font-medium text-muted-foreground",
            size === "xs" ? "w-6 h-6 text-[10px]" : size === "sm" ? "w-8 h-8" : "w-10 h-10"
          )}
        >
          +{remaining}
        </div>
      )}
    </div>
  );
}
