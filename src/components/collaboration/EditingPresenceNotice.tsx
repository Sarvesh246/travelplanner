"use client";

import { UserAvatar } from "@/components/shared/UserAvatar";
import type { ActiveTripEditor } from "@/components/collaboration/TripEditingPresenceProvider";
import { cn } from "@/lib/utils";

function formatNames(editors: ActiveTripEditor[]) {
  if (editors.length === 0) return "";
  if (editors.length === 1) return editors[0].name;
  if (editors.length === 2) return `${editors[0].name} and ${editors[1].name}`;
  return `${editors[0].name} and ${editors.length - 1} others`;
}

export function EditingPresenceNotice({
  editors,
  mode = "field",
  className,
}: {
  editors: ActiveTripEditor[];
  mode?: "field" | "surface";
  className?: string;
}) {
  if (editors.length === 0) return null;

  const names = formatNames(editors);
  const targetLabel =
    mode === "field"
      ? "this field"
      : editors[0].active?.fieldLabel
        ? editors[0].active.fieldLabel.toLowerCase()
        : "this section";

  return (
    <div
      className={cn(
        "mt-2 inline-flex min-h-8 max-w-full items-center gap-2 rounded-full border border-primary/20 bg-primary/8 px-2.5 py-1 text-[11px] font-medium leading-none text-muted-foreground",
        className
      )}
      role="status"
      aria-live="polite"
    >
      <div className="flex -space-x-1">
        {editors.slice(0, 3).map((editor) => (
          <UserAvatar
            key={`${editor.userId}-${editor.updatedAt}`}
            name={editor.name}
            avatarUrl={editor.avatarUrl}
            size="xs"
            className="ring-2 ring-background"
          />
        ))}
      </div>
      <span className="truncate">
        {names} {editors.length === 1 ? "is" : "are"} editing {targetLabel}
      </span>
    </div>
  );
}
