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
    high: "backdrop-blur-3xl"
  };

  return (
    <div
      className={cn(
        "rounded-[28px] p-6 shadow-lg",
        variant === "glass" && "bg-white/80 border border-white/30",
        variant === "elevated" && "bg-white border border-gray-100 shadow-xl",
        variant === "default" && "bg-white",
        intensityClasses[intensity],
        className
      )}
    >
      {children}
    </div>
  );
}
