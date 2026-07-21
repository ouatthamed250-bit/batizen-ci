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
        "min-h-screen pt-20 pb-16 px-4",
        "bg-[#FFFFFF] dark:bg-[#081423]",
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