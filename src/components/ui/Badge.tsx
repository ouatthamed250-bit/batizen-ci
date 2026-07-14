import type { ReactNode } from "react";
import { cn } from "@/lib/helpers";

type BadgeProps = {
  children: ReactNode;
  tone?: "blue" | "orange" | "green" | "navy" | "gray";
  className?: string;
};

const tones = {
  blue:   "bg-[#EAF2FF] text-[#0B5FFF]",
  orange: "bg-[#FFF3E8] text-[#FF7A00]",
  green:  "bg-[#ECFDF5] text-[#16A34A]",
  navy:   "bg-[#EEF2FF] text-[#0D2B6B]",
  gray:   "bg-[#F7F9FC] text-[#6B7280]",
};

export function Badge({ children, tone = "blue", className }: BadgeProps) {
  return (
    <span className={cn("inline-flex items-center rounded-full px-3 py-1 text-xs font-bold tracking-wide", tones[tone], className)}>
      {children}
    </span>
  );
}
