import { materiauxCI, QTY_PER_M2 } from "@/constants/materiaux";
import { getVilleCoefficient } from "@/constants/villes";
import type { PlanInput, QualityType } from "@/types/batizen";

export type EstimationResult = {
  materialsTotal: number;
  laborTotal: number;
  adminTotal: number;
  grandTotal: number;
  builtAreaM2: number;
  details: {
    materials: { name: string; qty: number; unit: string; cost: number }[];
    labor: { name: string; cost: number }[];
  };
};

function qualityMultiplier(quality: QualityType): number {
  return quality === "eco" ? 0.80 : quality === "premium" ? 1.50 : 1.0;
}

function computeBuiltArea(input: PlanInput): number {
  const landArea = input.landWidth * input.landLength;
  const coverage =
    input.landShape === "rectangulaire" ? 0.60 :
    input.landShape === "angle"         ? 0.55 : 0.50;
  const footprint = landArea * coverage;
  const builtArea = input.hasEtage ? footprint + footprint * 0.85 : footprint;
  return Math.max(60, Math.round(builtArea));
}

export const EstimationEngine = {
  calculate(input: PlanInput): EstimationResult {
    const builtAreaM2 = computeBuiltArea(input);

    const typeMultiplier =
      input.type === "lux"  ? 1.40 :
      input.type === "base" ? 0.85 : 1.0;

    const qMult = qualityMultiplier(input.quality);

    const comfortBonus =
      (input.bedrooms   - 1) * 0.035 +
      (input.bathrooms  - 1) * 0.025 +
      (input.hasGarage    ? 0.07 : 0) +
      (input.hasTerrace   ? 0.04 : 0) +
      (input.hasOffice    ? 0.03 : 0) +
      (input.hasDining    ? 0.02 : 0) +
      (input.hasGuestRoom ? 0.03 : 0);
    const comfortMultiplier = 1 + comfortBonus;

    const materials = materiauxCI.map((mat) => {
      const quality   = mat.qualities[input.quality];
      const qtyPerM2  = QTY_PER_M2[mat.id] ?? 0.5;
      const qty       = Math.round(builtAreaM2 * qtyPerM2);
      const cost      = Math.round(qty * quality.price * typeMultiplier * qMult);
      return { name: mat.name, qty, unit: mat.unit, cost };
    });

    const villeCoeff = getVilleCoefficient(input.location);

    const materialsTotal = Math.round(
      materials.reduce((sum, row) => sum + row.cost, 0) * comfortMultiplier * villeCoeff
    );

    const baseLaborPerM2 =
      input.type === "lux"  ? 95_000 :
      input.type === "base" ? 55_000 : 72_000;

    const laborTotal = Math.round(
      builtAreaM2 * baseLaborPerM2 * qMult * comfortMultiplier * villeCoeff
    );

    const adminTotal = input.hasAdminPapers ? 0 : 480_000;
    const grandTotal = materialsTotal + laborTotal + adminTotal;

    return {
      materialsTotal,
      laborTotal,
      adminTotal,
      grandTotal,
      builtAreaM2,
      details: {
        materials,
        labor: [
          { name: "Gros œuvre (fondations, structure, dalle)", cost: Math.round(laborTotal * 0.45) },
          { name: "Second œuvre (murs, toiture, menuiserie)",  cost: Math.round(laborTotal * 0.32) },
          { name: "Finitions & contrôle qualité BÂTIZEN",      cost: Math.round(laborTotal * 0.23) },
        ],
      },
    };
  },
};
