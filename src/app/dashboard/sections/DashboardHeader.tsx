"use client";

import { Moon, Sun } from "lucide-react";
import { ThemeToggle } from "@/components/layout/ThemeToggle";

export function DashboardHeader({ userName }: { userName: string }) {
  const hour = new Date().getHours();
  const greeting = hour < 18 ? "Bonjour" : "Bonsoir";
  return (
    <div className="flex items-center gap-3 mb-2">
      <span className="text-4xl" style={{ display: "inline-block", transformOrigin: "70% 70%", animation: "wave 2.5s infinite" }} role="img" aria-label="Salutation">✋🏽</span>
      <div>
        <h1 className="text-2xl font-black text-gray-900 dark:text-white leading-tight drop-shadow-lg">
          {greeting}, <span className="text-[#FF7A00] drop-shadow-md">{userName}</span>
        </h1>
        <p className="text-sm text-gray-600 dark:text-white/80 font-medium mt-1 drop-shadow-md">Prêt à suivre vos chantiers aujourd'hui ?</p>
      </div>
    </div>
  );
}