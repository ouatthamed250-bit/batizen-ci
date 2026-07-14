import type { ReactNode } from "react";
import { cn } from "@/lib/helpers";

type ScreenWrapperProps = {
  children: ReactNode;
  className?: string;
  withBottomPadding?: boolean;
};

export function ScreenWrapper({ children, className, withBottomPadding = true }: ScreenWrapperProps) {
  return (
    <main
      className={cn(
        "min-h-screen px-4 py-4 sm:px-6 lg:px-8",
        "screen-bg-default",
        "dark:screen-bg-dark",
        withBottomPadding && "pb-28",
        className
      )}
    >
      <div className="mx-auto w-full max-w-2xl lg:max-w-5xl xl:max-w-6xl">
        {children}
      </div>
    </main>
  );
}
