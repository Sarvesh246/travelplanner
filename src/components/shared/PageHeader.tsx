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
        "app-page-band app-surface mb-5 grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start lg:gap-x-6",
        className
      )}
    >
      <div className="relative z-10 min-w-0 max-w-4xl">
        {eyebrow && (
          <p className="app-kicker mb-2">
            <span className="app-waypoint" aria-hidden />
            {eyebrow}
          </p>
        )}
        <h1 className="text-[1.95rem] font-semibold tracking-tight sm:text-[2.15rem]">{title}</h1>
        {description && (
          <p className="mt-1.5 max-w-[46rem] break-words text-sm leading-6 text-muted-foreground sm:text-[15px]">
            {description}
          </p>
        )}
      </div>
      {actions && (
        <div className="relative z-10 flex w-full flex-wrap items-center gap-2 lg:w-auto lg:justify-end lg:pt-1 [&_button]:min-h-10 lg:[&_button]:min-h-0">
          {actions}
        </div>
      )}
    </div>
  );
}
