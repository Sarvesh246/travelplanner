import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
}

export function PageHeader({ title, description, actions, className }: PageHeaderProps) {
  return (
    <div
      className={cn(
        "mb-6 flex flex-col gap-4 min-[480px]:flex-row min-[480px]:items-start min-[480px]:justify-between min-[480px]:gap-4",
        className
      )}
    >
      <div className="min-w-0">
        <h1 className="text-lg font-semibold min-[480px]:text-xl">{title}</h1>
        {description && (
          <p className="text-sm text-muted-foreground mt-0.5 break-words">{description}</p>
        )}
      </div>
      {actions && (
        <div className="flex flex-wrap items-center justify-end gap-2 min-[480px]:shrink-0 w-full min-[480px]:w-auto [&_button]:min-h-10 min-[480px]:[&_button]:min-h-0">
          {actions}
        </div>
      )}
    </div>
  );
}
