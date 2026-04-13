import React from "react";
import { cn } from "@/src/lib/utils";
import { motion } from "motion/react";

interface NeonButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "cyan" | "pink" | "purple";
  glow?: boolean;
  children?: React.ReactNode;
  className?: string;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
}

export const NeonButton = ({ 
  children, 
  className, 
  variant = "cyan", 
  glow = true,
  ...props 
}: NeonButtonProps) => {
  const variants = {
    cyan: "bg-neon-cyan/10 border-neon-cyan text-neon-cyan hover:bg-neon-cyan hover:text-black",
    pink: "bg-neon-pink/10 border-neon-pink text-neon-pink hover:bg-neon-pink hover:text-black",
    purple: "bg-neon-purple/10 border-neon-purple text-neon-purple hover:bg-neon-purple hover:text-black",
  };

  const glows = {
    cyan: "shadow-[0_0_15px_rgba(0,243,255,0.3)] hover:shadow-[0_0_25px_rgba(0,243,255,0.6)]",
    pink: "shadow-[0_0_15px_rgba(255,0,255,0.3)] hover:shadow-[0_0_25px_rgba(255,0,255,0.6)]",
    purple: "shadow-[0_0_15px_rgba(157,0,255,0.3)] hover:shadow-[0_0_25px_rgba(157,0,255,0.6)]",
  };

  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className={cn(
        "px-6 py-3 rounded-xl border font-bold transition-all duration-300",
        variants[variant],
        glow && glows[variant],
        className
      )}
      {...props}
    >
      {children}
    </motion.button>
  );
};
