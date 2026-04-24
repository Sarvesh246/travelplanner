import { getInitials } from "@/lib/utils";
import { cn } from "@/lib/utils";
import Image from "next/image";

interface UserAvatarProps {
  name: string;
  avatarUrl?: string | null;
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
}

const sizes = {
  xs: "w-6 h-6 text-[10px]",
  sm: "w-8 h-8 text-xs",
  md: "w-10 h-10 text-sm",
  lg: "w-12 h-12 text-base",
};

const colors = [
  "bg-[hsl(var(--primary)/0.1)] text-[hsl(var(--primary))] dark:bg-[hsl(var(--primary)/0.2)]",
  "bg-[hsl(var(--secondary)/0.1)] text-[hsl(var(--secondary))] dark:bg-[hsl(var(--secondary)/0.2)]",
  "bg-[hsl(var(--accent)/0.1)] text-[hsl(var(--accent))] dark:bg-[hsl(var(--accent)/0.2)]",
  "bg-[hsl(var(--success)/0.1)] text-[hsl(var(--success))] dark:bg-[hsl(var(--success)/0.2)]",
  "bg-[hsl(var(--destructive)/0.1)] text-[hsl(var(--destructive))] dark:bg-[hsl(var(--destructive)/0.2)]",
  "bg-[hsl(var(--warning)/0.1)] text-[hsl(var(--warning))] dark:bg-[hsl(var(--warning)/0.2)]",
];

function colorForName(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash + name.charCodeAt(i)) % colors.length;
  return colors[hash];
}

export function UserAvatar({ name, avatarUrl, size = "md", className }: UserAvatarProps) {
  const sizeClass = sizes[size];

  if (avatarUrl) {
    return (
      <div className={cn("rounded-full overflow-hidden shrink-0 ring-2 ring-background", sizeClass, className)}>
        <Image
          src={avatarUrl}
          alt={name}
          width={48}
          height={48}
          className="w-full h-full object-cover"
        />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "rounded-full flex items-center justify-center font-semibold shrink-0 ring-2 ring-background",
        sizeClass,
        colorForName(name),
        className
      )}
    >
      {getInitials(name)}
    </div>
  );
}
