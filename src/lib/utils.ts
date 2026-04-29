import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(
  amount: number | string | null | undefined,
  currency = "USD"
): string {
  const num = typeof amount === "string" ? parseFloat(amount) : (amount ?? 0);
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function calendarDate(date: Date | string): Date {
  if (typeof date === "string") {
    const dateOnly = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
    if (dateOnly) {
      const [, year, month, day] = dateOnly;
      return new Date(Number(year), Number(month) - 1, Number(day));
    }
  }

  const parsed = new Date(date);
  if (
    parsed.getUTCHours() === 0 &&
    parsed.getUTCMinutes() === 0 &&
    parsed.getUTCSeconds() === 0 &&
    parsed.getUTCMilliseconds() === 0
  ) {
    return new Date(parsed.getUTCFullYear(), parsed.getUTCMonth(), parsed.getUTCDate());
  }

  return parsed;
}

export function formatDate(
  date: Date | string | null | undefined,
  opts?: Intl.DateTimeFormatOptions
): string {
  if (!date) return "—";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    ...opts,
  }).format(calendarDate(date));
}

export function formatDateRange(
  start: Date | string | null | undefined,
  end: Date | string | null | undefined
): string {
  if (!start) return "Dates TBD";
  if (!end) return formatDate(start);
  const s = calendarDate(start);
  const e = calendarDate(end);
  const sameYear = s.getFullYear() === e.getFullYear();
  const sameMonth = sameYear && s.getMonth() === e.getMonth();
  if (sameMonth) {
    return `${new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(s)}–${e.getDate()}, ${e.getFullYear()}`;
  }
  if (sameYear) {
    return `${new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(s)} – ${new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(e)}`;
  }
  return `${formatDate(s)} – ${formatDate(e)}`;
}

export function daysUntil(date: Date | string | null | undefined): number | null {
  if (!date) return null;
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const target = calendarDate(date);
  target.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

export function tripDuration(
  start: Date | string | null | undefined,
  end: Date | string | null | undefined
): number | null {
  if (!start || !end) return null;
  const s = calendarDate(start);
  const e = calendarDate(end);
  return Math.ceil((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)) + 1;
}

export function gradientForId(id: string): string {
  const gradients = [
    "from-[hsl(126,38%,22%)] to-[hsl(110,28%,56%)]",
    "from-[hsl(110,28%,48%)] to-[hsl(112,32%,70%)]",
    "from-[hsl(112,28%,64%)] to-[hsl(50,38%,88%)]",
    "from-[hsl(126,34%,16%)] to-[hsl(110,30%,46%)]",
    "from-[hsl(76,18%,84%)] to-[hsl(126,32%,28%)]",
    "from-[hsl(50,45%,82%)] to-[hsl(110,28%,52%)]",
  ];
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash << 5) - hash + id.charCodeAt(i);
    hash |= 0;
  }
  return gradients[Math.abs(hash) % gradients.length];
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + "…";
}
