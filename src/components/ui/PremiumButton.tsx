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
    primary: "bg-gradient-to-b from-[#FF8C00] to-[#CC5500] text-white hover:from-[#FF9A30] hover:to-[#E06000]",
    secondary: "bg-gradient-to-b from-[#1A3B8E] to-[#081D4A] text-white hover:from-[#2550B0] hover:to-[#0D2B6B]",
    success: "bg-gradient-to-b from-[#34D399] to-[#15803D] text-white hover:from-[#4ADE80] hover:to-[#16A34A]",
    neutral: "bg-gradient-to-b from-[#9CA3AF] to-[#374151] text-white hover:from-[#B0B7C3] hover:to-[#4B5563]",
    danger: "bg-gradient-to-b from-[#F87171] to-[#B91C1C] text-white hover:from-[#FCA5A5] hover:to-[#DC2626]",
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
    "px-5 py-3 rounded-xl font-semibold text-sm",
    "shadow-lg shadow-black/20",
    "border border-white/20",
    "transition-all duration-200",
    "hover:-translate-y-0.5 hover:shadow-xl hover:shadow-black/30",
    "active:translate-y-0.5 active:shadow-md",
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