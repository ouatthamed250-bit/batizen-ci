"use client";

import Link from "next/link";
import type { ButtonHTMLAttributes } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/helpers";

interface PremiumButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "success" | "neutral" | "danger" | "outline" | "google";
  children: React.ReactNode;
  href?: string;
  onClick?: () => void;
  className?: string;
  type?: "button" | "submit";
  disabled?: boolean;
  icon?: LucideIcon;
  iconPosition?: "left" | "right";
}

export function PremiumButton({ 
  variant = "primary", 
  children,
  href,
  onClick,
  className,
  type = "button",
  disabled = false,
  icon: Icon,
  iconPosition = "left",
}: PremiumButtonProps) {
  
  const variants = {
    primary: "bg-gradient-to-r from-[#0B5FFF] to-[#0D2B6B] text-white hover:from-[#2563EB] hover:to-[#1D4ED8]",
    secondary: "bg-gradient-to-r from-[#FF7A00] to-[#D97706] text-white hover:from-[#FF8C00] hover:to-[#FF6B00]",
    success: "bg-gradient-to-r from-[#22C55E] to-[#16A34A] text-white hover:from-[#34D399] hover:to-[#22C55E]",
    neutral: "bg-gradient-to-r from-[#6B7280] to-[#4B5563] text-white hover:from-[#9CA3AF] hover:to-[#6B7280]",
    danger: "bg-gradient-to-r from-[#EF4444] to-[#DC2626] text-white hover:from-[#F87171] hover:to-[#EF4444]",
    outline: "bg-transparent text-[#0D2B6B] border-2 border-[#0D2B6B] hover:bg-[#0D2B6B] hover:text-white",
    google: "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50",
  };

  const content = (
    <span className="relative flex items-center justify-center gap-2">
      {Icon && iconPosition === "left" && <Icon size={18} aria-hidden />}
      <span className="font-semibold text-sm">{children}</span>
      {Icon && iconPosition === "right" && <Icon size={18} aria-hidden />}
    </span>
  );

  const classes = cn(
    variants[variant],
    "px-6 py-3 rounded-[24px] font-semibold text-sm",
    "shadow-lg shadow-black/20",
    "border border-white/20",
    "transition-all duration-200",
    "hover:-translate-y-0.5 hover:shadow-xl active:scale-95",
    "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0",
    className
  );

  if (href) {
    return (
      <Link href={disabled ? "#" : href} className={classes}>
        {content}
      </Link>
    );
  }

  return (
    <button className={classes} type={type} disabled={disabled} onClick={onClick}>
      {content}
    </button>
  );
}