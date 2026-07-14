"use client";

import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/helpers";

type PremiumButtonVariant = "primary" | "secondary" | "outline" | "google" | "whatsapp" | "orange";

type PremiumButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  href?: string;
  variant?: PremiumButtonVariant;
  icon?: LucideIcon;
  iconPosition?: "left" | "right";
};

const variantClasses: Record<PremiumButtonVariant, string> = {
  primary:
    "bg-[linear-gradient(160deg,#1A6FFF_0%,#0B5FFF_40%,#0A3FCC_100%)] text-white " +
    "shadow-[0_10px_0_rgba(8,40,140,0.7),0_14px_32px_rgba(11,95,255,0.5)] " +
    "hover:shadow-[0_12px_0_rgba(8,40,140,0.7),0_18px_40px_rgba(11,95,255,0.6)] " +
    "hover:-translate-y-1.5 active:translate-y-[4px] active:shadow-[0_3px_0_rgba(8,40,140,0.7),0_5px_14px_rgba(11,95,255,0.35)] " +
    "dark:bg-[linear-gradient(160deg,#5B9FFF_0%,#4B8FFF_40%,#3A6FDD_100%)] " +
    "dark:shadow-[0_10px_0_rgba(20,60,120,0.8),0_14px_32px_rgba(75,143,255,0.55)] " +
    "dark:hover:shadow-[0_12px_0_rgba(20,60,120,0.8),0_18px_40px_rgba(75,143,255,0.65)]",
  secondary:
    "bg-[linear-gradient(160deg,#1A3A7A_0%,#0D2B6B_100%)] text-white " +
    "shadow-[0_8px_0_rgba(5,18,50,0.8),0_12px_28px_rgba(13,43,107,0.4)] " +
    "hover:-translate-y-1.5 active:translate-y-[4px] " +
    "dark:bg-[linear-gradient(160deg,#2A4A8A_0%,#1A3B8E_100%)] " +
    "dark:shadow-[0_8px_0_rgba(10,30,70,0.9),0_12px_28px_rgba(26,59,142,0.45)]",
  orange:
    "bg-[linear-gradient(160deg,#FF9A30_0%,#FF7A00_45%,#E06000_100%)] text-white " +
    "shadow-[0_10px_0_rgba(160,60,0,0.65),0_14px_32px_rgba(255,122,0,0.5)] " +
    "hover:shadow-[0_12px_0_rgba(160,60,0,0.65),0_18px_40px_rgba(255,122,0,0.6)] " +
    "hover:-translate-y-1.5 active:translate-y-[4px] active:shadow-[0_3px_0_rgba(160,60,0,0.65),0_5px_14px_rgba(255,122,0,0.35)] " +
    "dark:bg-[linear-gradient(160deg,#FFAA40_0%,#FF8A20_45%,#F07010_100%)] " +
    "dark:shadow-[0_10px_0_rgba(180,80,20,0.7),0_14px_32px_rgba(255,138,32,0.55)] " +
    "dark:hover:shadow-[0_12px_0_rgba(180,80,20,0.7),0_18px_40px_rgba(255,138,32,0.65)]",
  outline:
    "border-2 border-[#C5D0E8] bg-white/80 text-[#0A1628] backdrop-blur-sm " +
    "shadow-[0_6px_0_rgba(13,43,107,0.15),0_8px_20px_rgba(13,43,107,0.1)] " +
    "hover:border-[#0B5FFF] hover:text-[#0B5FFF] hover:-translate-y-0.5 active:translate-y-[3px] " +
    "dark:border-[#1E3A6E] dark:bg-[#08142E]/80 dark:text-[#E8F0FF] " +
    "dark:hover:border-[#4B8FFF] dark:hover:text-[#4B8FFF]",
  google:
    "border border-[#C5D0E8] bg-white text-[#0A1628] " +
    "shadow-[0_6px_0_rgba(13,43,107,0.12),0_8px_20px_rgba(0,0,0,0.1)] hover:border-[#0B5FFF]/40 hover:-translate-y-0.5 " +
    "dark:border-[#1E3A6E] dark:bg-[#08142E] dark:text-[#E8F0FF] " +
    "dark:hover:border-[#4B8FFF]/50",
  whatsapp:
    "bg-[linear-gradient(160deg,#2EE87A_0%,#25D366_50%,#1AAD52_100%)] text-white " +
    "shadow-[0_8px_0_rgba(15,120,55,0.7),0_12px_28px_rgba(37,211,102,0.45)] " +
    "hover:-translate-y-1.5 active:translate-y-[4px] " +
    "dark:bg-[linear-gradient(160deg,#3EF88A_0%,#35E376_50%,#2ABD62_100%)] " +
    "dark:shadow-[0_8px_0_rgba(20,140,65,0.8),0_12px_28px_rgba(52,211,102,0.55)]",
};

export function PremiumButton({
  children,
  href,
  variant = "primary",
  icon: Icon,
  iconPosition = "left",
  className,
  type = "button",
  disabled = false,
  ...props
}: PremiumButtonProps) {
  const content = (
    <span className="relative flex items-center justify-center gap-2.5">
      {/* Reflet interne */}
      <span className="pointer-events-none absolute inset-x-0 top-0 h-[45%] rounded-t-[18px] bg-gradient-to-b from-white/22 to-transparent" />
      {Icon && iconPosition === "left" && <Icon size={20} aria-hidden />}
      <span className="tracking-tight font-black">{children}</span>
      {Icon && iconPosition === "right" && <Icon size={20} aria-hidden />}
    </span>
  );

  const classes = cn(
    "btn-3d inline-flex h-[58px] w-full items-center justify-center rounded-[20px] px-8 text-base font-black",
    "transition-all duration-150",
    "relative overflow-hidden",
    disabled && "cursor-not-allowed opacity-60 !transform-none !shadow-none",
    variantClasses[variant],
    className
  );

  if (href) {
    return (
      <Link
        className={classes}
        href={disabled ? "#" : href}
        aria-disabled={disabled || undefined}
        onClick={(e) => { if (disabled) { e.preventDefault(); return; } props.onClick?.(e as never); }}
      >
        {content}
      </Link>
    );
  }

  return (
    <button className={classes} type={type} disabled={disabled} {...props}>
      {content}
    </button>
  );
}
