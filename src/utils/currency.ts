export function formatFcfa(value: number): string {
  return new Intl.NumberFormat("fr-CI", {
    style: "currency",
    currency: "XOF",
    maximumFractionDigits: 0,
  }).format(value);
}
