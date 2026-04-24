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
        "bg-card border border-border rounded-2xl p-5 hover:border-border/80 hover:shadow-sm transition-all",
        href && "cursor-pointer hover:-translate-y-0.5",
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide mb-1">{label}</p>
          <p className="text-2xl font-bold">{value}</p>
        </div>
        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", iconColor ?? "bg-primary/10 text-primary")}>
          {icon}
        </div>
      </div>
    </motion.div>
  );

  if (href) return <Link href={href}>{content}</Link>;
  return content;
}
