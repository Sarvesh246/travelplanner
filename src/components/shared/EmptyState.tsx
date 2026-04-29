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
    <div className={cn("app-surface rounded-2xl px-5 py-12 text-center sm:px-8 sm:py-14", className)}>
      <div className="mx-auto flex max-w-[34rem] flex-col items-center">
        <div className="relative mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-[0_0_0_1px_hsl(var(--primary)/0.14)]">
          {icon}
        </div>
        <h3 className="mb-1 text-[1.85rem] font-semibold tracking-tight">{title}</h3>
        <p className="max-w-[28rem] text-sm leading-6 text-muted-foreground sm:text-[15px]">{description}</p>
        <div className="app-route-divider mb-5 mt-5 w-full max-w-[17rem]" aria-hidden />
        {action ? <div className="flex w-full flex-wrap items-center justify-center gap-2">{action}</div> : null}
      </div>
    </div>
  );
}
