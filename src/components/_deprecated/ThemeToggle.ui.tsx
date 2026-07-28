"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="relative flex h-12 w-12 items-center justify-center rounded-full bg-white/80 backdrop-blur-sm shadow-[0_4px_12px_rgba(13,43,107,0.15)] border transition-all hover:scale-110 active:scale-95 dark:bg-[#08142E]/80 dark:shadow-[0_4px_12px_rgba(0,0,0,0.4)]"
      style={{ borderColor: "var(--stroke)" }}
      aria-label="Changer de thème"
    >
      <Sun className="h-5 w-5 transition-all dark:opacity-0 dark:rotate-90" style={{ color: "var(--orange)" }} />
      <Moon className="absolute h-5 w-5 transition-all opacity-0 -rotate-90 dark:opacity-100 dark:rotate-0" style={{ color: "var(--primary)" }} />
    </button>
  );
}
