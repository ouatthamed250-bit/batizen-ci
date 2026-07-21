import { type ReactNode } from "react";
import { cn } from "@/lib/helpers";

interface PremiumCardProps {
  children: ReactNode;
  className?: string;
  variant?: "default" | "elevated" | "glass";
  intensity?: "low" | "medium" | "high";
}

export function PremiumCard({ 
  children, 
  className, 
  variant = "glass",
  intensity = "medium"
}: PremiumCardProps) {
  const intensityClasses = {
    low: "backdrop-blur-sm",
    medium: "backdrop-blur-xl",
    high: "backdrop-blur-2xl"
  };

  return (
    <div
      className={cn(
        "rounded-[28px] p-6 shadow-lg",
        variant === "glass" && "bg-white/10 border border-white/20",
        variant === "elevated" && "bg-white/20 border border-white/30 shadow-xl",
        variant === "default" && "bg-white/90",
        intensityClasses[intensity],
        "transition-all duration-300",
        className
      )}
    >
      {children}
    </div>
  );
}