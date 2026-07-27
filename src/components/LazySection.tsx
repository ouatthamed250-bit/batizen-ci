"use client";

import { Suspense, ReactNode } from "react";
import dynamic from "next/dynamic";
import { ErrorBoundary } from "./ErrorBoundary";

interface LazySectionProps {
  loader: () => Promise<any>;
  fallback?: ReactNode;
  ssr?: boolean;
}

const defaultFallback = (
  <div className="h-48 w-full animate-pulse rounded-xl bg-gray-200 dark:bg-gray-800" />
);

export function LazySection({ loader, fallback, ssr = false }: LazySectionProps) {
  const DynamicComponent = dynamic(loader, {
    ssr,
    loading: () => <>{fallback || defaultFallback}</>,
  });

  return (
    <ErrorBoundary>
      <Suspense fallback={fallback || defaultFallback}>
        <DynamicComponent />
      </Suspense>
    </ErrorBoundary>
  );
}