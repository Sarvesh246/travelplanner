"use client";

import { motion, AnimatePresence } from "framer-motion";
import { staggerContainer, listItem } from "@/lib/motion";
import { cn } from "@/lib/utils";

interface AnimatedListProps<T> {
  items: T[];
  keyExtractor: (item: T) => string;
  renderItem: (item: T, index: number) => React.ReactNode;
  className?: string;
  itemClassName?: string;
  layout?: "vertical" | "grid";
  emptyState?: React.ReactNode;
}

export function AnimatedList<T>({
  items,
  keyExtractor,
  renderItem,
  className,
  itemClassName,
  layout = "vertical",
  emptyState,
}: AnimatedListProps<T>) {
  if (items.length === 0 && emptyState) return <>{emptyState}</>;

  return (
    <motion.div
      variants={staggerContainer}
      initial="initial"
      animate="animate"
      className={cn(
        layout === "grid" ? "grid gap-4 sm:grid-cols-2 lg:grid-cols-3" : "space-y-3",
        className
      )}
    >
      <AnimatePresence mode="popLayout">
        {items.map((item, index) => (
          <motion.div
            key={keyExtractor(item)}
            variants={listItem}
            layout
            className={itemClassName}
          >
            {renderItem(item, index)}
          </motion.div>
        ))}
      </AnimatePresence>
    </motion.div>
  );
}
