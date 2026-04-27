import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
  eyebrow?: string;
}

export function PageHeader({ title, description, actions, className, eyebrow }: PageHeaderProps) {
  return (
    <div
      className={cn(
        "app-page-band app-surface mb-5 flex flex-col gap-4 min-[480px]:flex-row min-[480px]:items-start min-[480px]:justify-between min-[480px]:gap-4",
        className
      )}
    >
      <div className="relative z-10 min-w-0">
        {eyebrow && (
          <p className="app-kicker mb-2">
            <span className="app-waypoint" aria-hidden />
            {eyebrow}
          </p>
        )}
        <h1 className="text-xl font-semibold tracking-tight min-[480px]:text-2xl">{title}</h1>
        {description && (
          <p className="text-sm text-muted-foreground mt-1 max-w-2xl break-words">{description}</p>
        )}
      </div>
      {actions && (
        <div className="relative z-10 flex flex-wrap items-center justify-end gap-2 min-[480px]:shrink-0 w-full min-[480px]:w-auto [&_button]:min-h-10 min-[480px]:[&_button]:min-h-0">
          {actions}
        </div>
      )}
    </div>
  );
}
