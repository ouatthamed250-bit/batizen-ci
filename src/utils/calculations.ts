export function estimateConstructionBudget(surfaceM2: number, pricePerM2: number): number {
  return Math.round(surfaceM2 * pricePerM2);
}

export function calculateProgress(stepsDone: number, totalSteps: number): number {
  if (totalSteps <= 0) return 0;
  return Math.round((stepsDone / totalSteps) * 100);
}
