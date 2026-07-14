"use client";

import { useMemo } from "react";

export function useCurrencyFormatter() {
  return useMemo(
    () =>
      new Intl.NumberFormat("fr-CI", {
        style: "currency",
        currency: "XOF",
        maximumFractionDigits: 0,
      }),
    [],
  );
}
