import type { ReactNode } from "react";
import { cn } from "@/lib/helpers";

type PremiumCardProps = {
  children: ReactNode;
  className?: string;
  glass?: boolean;
  intensity?: "low" | "high";
};

export function PremiumCard({ children, className, glass = false, intensity = "low" }: PremiumCardProps) {
  return (
    <div
      className={cn(
        "premium-card relative rounded-[28px] p-6",
        "transition-all duration-500",
        "transform-gpu will-change-transform",
        // Reflet interne en haut
        "before:pointer-events-none before:absolute before:inset-x-6 before:top-0 before:h-px before:rounded-full before:bg-gradient-to-r before:from-transparent before:via-white/80 before:to-transparent dark:before:via-white/20",
        glass
          ? "glass-card hover:-translate-y-2 hover:shadow-[0_28px_60px_rgba(13,43,107,0.16),inset_0_1px_0_rgba(255,255,255,0.9)] dark:hover:shadow-[0_28px_60px_rgba(0,0,0,0.3),dark:inset_0_1px_0_rgba(255,255,255,0.1)]"
          : cn(
              "bg-white/92 border border-white/70 dark:bg-[#0D1B3E]/92 dark:border-[#1E3A6E]",
              "backdrop-blur-sm",
              intensity === "high"
                ? "shadow-[0_16px_48px_rgba(13,43,107,0.12),0_4px_0_rgba(13,43,107,0.04),inset_0_1px_0_rgba(255,255,255,1)] dark:shadow-[0_16px_48px_rgba(0,0,0,0.3),dark:inset_0_1px_0_rgba(255,255,255,0.1)]"
                : "shadow-[0_6px_24px_rgba(13,43,107,0.08),0_2px_0_rgba(13,43,107,0.03),inset_0_1px_0_rgba(255,255,255,1)] dark:shadow-[0_6px_24px_rgba(0,0,0,0.2),dark:inset_0_1px_0_rgba(255,255,255,0.1)]",
              "hover:-translate-y-2",
              intensity === "high"
                ? "hover:shadow-[0_28px_64px_rgba(13,43,107,0.16),0_4px_0_rgba(13,43,107,0.04)] dark:hover:shadow-[0_28px_64px_rgba(0,0,0,0.4)]"
                : "hover:shadow-[0_18px_44px_rgba(13,43,107,0.12),0_2px_0_rgba(13,43,107,0.03)] dark:hover:shadow-[0_18px_44px_rgba(0,0,0,0.3)]",
            ),
        className
      )}
    >
      {children}
    </div>
  );
}
