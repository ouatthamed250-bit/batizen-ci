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
        "min-h-screen pt-20 pb-16 px-4 sm:px-6 lg:px-8",
        "bg-[#f9fafb]",
        "dark:screen-bg-dark",
        className
      )}
    >
      <div className="mx-auto w-full max-w-2xl lg:max-w-5xl xl:max-w-6xl">
        {children}
      </div>
    </main>
  );
}