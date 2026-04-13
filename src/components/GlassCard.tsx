import React from "react";
import { cn } from "@/src/lib/utils";
import { motion } from "motion/react";

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
}

export const GlassCard = ({ children, className, hover = true }: GlassCardProps) => {
  return (
    <motion.div
      whileHover={hover ? { scale: 1.01, translateY: -2 } : {}}
      className={cn(
        "glass rounded-3xl p-6 shadow-2xl relative overflow-hidden",
        "before:absolute before:inset-0 before:bg-gradient-to-br before:from-white/5 before:to-transparent before:pointer-events-none",
        className
      )}
    >
      {children}
    </motion.div>
  );
};
