"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/helpers";

interface BackButtonProps {
  href?: string;
  onClick?: () => void;
  className?: string;
  label?: string;
}

export function BackButton({ href, onClick, className, label = "Retour" }: BackButtonProps) {
  const router = useRouter();

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else if (href) {
      router.push(href);
    } else {
      router.back();
    }
  };

  return (
    <button
      onClick={handleClick}
      className={cn(
        "flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold transition-all active:scale-95",
        "bg-white/80 border border-[#E7EBF5] text-[#0D2B6B] shadow-[0_4px_12px_rgba(13,43,107,0.08)]",
        "hover:bg-[#F7F9FC] hover:border-[#0B5FFF] hover:text-[#0B5FFF]",
        "dark:bg-[#0D1B3E]/80 dark:border-[#1E3A6E] dark:text-[#F0F4FF] dark:hover:border-[#3B7FFF] dark:hover:text-[#3B7FFF]",
        className
      )}
      aria-label={label}
    >
      <ArrowLeft size={18} aria-hidden />
      <span>{label}</span>
    </button>
  );
}
