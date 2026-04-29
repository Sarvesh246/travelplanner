"use client";

import { motion } from "framer-motion";
import { scaleIn } from "@/lib/motion";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  iconColor?: string;
  href?: string;
  className?: string;
}

export function StatCard({ label, value, icon, iconColor, href, className }: StatCardProps) {
  const content = (
    <motion.div
      variants={scaleIn}
      className={cn(
        "app-surface min-h-[8.25rem] min-w-0 rounded-2xl p-4 transition-all min-[480px]:min-h-[8.75rem] min-[480px]:p-4.5",
        href && "app-hover-lift cursor-pointer",
        className
      )}
    >
      <div className="flex h-full items-start justify-between gap-3">
        <div className="flex min-h-full min-w-0 flex-1 flex-col justify-between">
          <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground sm:text-xs">{label}</p>
          <p className="text-[1.7rem] font-bold leading-none sm:text-[1.9rem]">{value}</p>
        </div>
        <div className={cn("flex h-10 w-10 items-center justify-center rounded-xl", iconColor ?? "bg-primary/10 text-primary")}>
          {icon}
        </div>
      </div>
    </motion.div>
  );

  if (href) return <Link href={href}>{content}</Link>;
  return content;
}
