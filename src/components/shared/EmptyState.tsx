import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn("app-surface flex flex-col items-center justify-center rounded-2xl px-4 py-14 text-center", className)}>
      <div className="relative mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-[0_0_0_1px_hsl(var(--primary)/0.14)]">
        <span className="app-waypoint absolute -right-1 -top-1" aria-hidden />
        {icon}
      </div>
      <h3 className="font-semibold text-base mb-1">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-sm mb-4">{description}</p>
      <div className="app-route-divider mb-5 w-full max-w-xs" aria-hidden />
      {action}
    </div>
  );
}
