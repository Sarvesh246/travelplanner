"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ArrowUpDown } from "lucide-react";
import {
  DASHBOARD_TRIP_SORT_OPTIONS,
  DEFAULT_DASHBOARD_TRIP_SORT,
  parseDashboardTripSort,
} from "@/lib/dashboard-trip-sort";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function DashboardTripSortSelect() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const current = parseDashboardTripSort(searchParams.get("sort") ?? undefined);

  function onValueChange(v: string) {
    const next = new URLSearchParams(searchParams.toString());
    if (v === DEFAULT_DASHBOARD_TRIP_SORT) {
      next.delete("sort");
    } else {
      next.set("sort", v);
    }
    const q = next.toString();
    router.push(q ? `${pathname}?${q}` : pathname, { scroll: false });
  }

  return (
    <div className="flex min-w-0 max-w-full shrink-0 items-center gap-2 text-sm text-muted-foreground">
      <ArrowUpDown className="h-4 w-4 shrink-0" aria-hidden />
      <span className="shrink-0">Sort by</span>
      <Select value={current} onValueChange={onValueChange}>
        <SelectTrigger
          className="h-9 w-full min-w-[7.5rem] min-[480px]:w-44 min-[480px]:max-w-[min(12rem,100%)] min-[480px]:shrink-0 sm:min-w-[12rem] [&>span]:line-clamp-none"
          aria-label="Sort trips"
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {DASHBOARD_TRIP_SORT_OPTIONS.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
