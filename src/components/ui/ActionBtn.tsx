"use client";

import Link from "next/link";
import type { LucideIcon } from "lucide-react";

interface ActionBtnProps {
  icon: LucideIcon;
  label: string;
  href?: string;
  onClick?: () => void;
  color?: string;
}

export function ActionBtn({ icon: Icon, label, href, onClick, color = "#0B5FFF" }: ActionBtnProps) {
  if (href) {
    return (
      <Link
        href={href}
        target={href.startsWith("http") || href.startsWith("tel") ? "_blank" : undefined}
        rel="noreferrer"
        className="flex flex-1 flex-col items-center justify-center gap-1 rounded-[14px] py-2.5 text-white transition active:scale-95"
        style={{ backgroundColor: color }}
      >
        <Icon size={18} aria-hidden />
        <span className="text-[10px] font-black leading-none">{label}</span>
      </Link>
    );
  }

  return (
    <button
      onClick={onClick}
      className="flex flex-1 flex-col items-center justify-center gap-1 rounded-[14px] py-2.5 text-white transition active:scale-95"
      style={{ backgroundColor: color }}
    >
      <Icon size={18} aria-hidden />
      <span className="text-[10px] font-black leading-none">{label}</span>
    </button>
  );
}