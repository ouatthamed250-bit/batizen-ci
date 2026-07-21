import type { ReactNode } from "react";
import { cn } from "@/lib/helpers";

type ScreenWrapperProps = {
  children: ReactNode;
  className?: string;
};

export function ScreenWrapper({ children, className }: ScreenWrapperProps) {
  return (
    <main
      className={cn(
        "ios-scroll min-h-screen pt-4 pb-16 px-4", // pt-4 au lieu de pt-20 (header gère l'espace)
        "bg-white/90 dark:bg-[#081423]/60 backdrop-blur-sm", // glassmorphism
        "dark:text-white text-gray-800",
        className
      )}
    >
      {/* Container mobile centré 430px max */}
      <div className="mx-auto w-full max-w-[430px]">
        {children}
      </div>
    </main>
  );
}