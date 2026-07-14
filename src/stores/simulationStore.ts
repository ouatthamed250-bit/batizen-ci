import { create } from "zustand";
import { EstimationEngine, type EstimationResult } from "@/services/EstimationEngine";
import { PlanEngine } from "@/services/PlanEngine";
import type { GeneratedPlan, KitchenType, LandShape, Orientation, PlanInput, ProjectType, QualityType } from "@/types/batizen";

type SimulationState = PlanInput & {
  estimation: EstimationResult | null;
  generatedPlan: GeneratedPlan | null;
  setConfig: (partial: Partial<PlanInput>) => void;
  runCalculation: () => void;
};

export const useSimulationStore = create<SimulationState>((set, get) => ({
  landWidth: 15,
  landLength: 20,
  location: "Abidjan",
  hasAdminPapers: false,
  landShape: "rectangulaire" satisfies LandShape,
  orientation: "nord" satisfies Orientation,
  type: "standard" satisfies ProjectType,
  hasEtage: false,
  quality: "standard" satisfies QualityType,
  bedrooms: 3,
  bathrooms: 2,
  livingRooms: 1,
  hasDining: true,
  kitchenType: "semi-ouverte" satisfies KitchenType,
  hasOffice: false,
  hasGarage: false,
  hasTerrace: true,
  hasGuestRoom: false,
  estimation: null,
  generatedPlan: null,

  setConfig: (partial) => set(partial),
  runCalculation: () => {
    const state = get();
    const input: PlanInput = {
      landWidth: state.landWidth,
      landLength: state.landLength,
      location: state.location,
      hasAdminPapers: state.hasAdminPapers,
      landShape: state.landShape,
      orientation: state.orientation,
      type: state.type,
      hasEtage: state.hasEtage,
      quality: state.quality,
      bedrooms: state.bedrooms,
      bathrooms: state.bathrooms,
      livingRooms: state.livingRooms,
      hasDining: state.hasDining,
      kitchenType: state.kitchenType,
      hasOffice: state.hasOffice,
      hasGarage: state.hasGarage,
      hasTerrace: state.hasTerrace,
      hasGuestRoom: state.hasGuestRoom,
    };

    set({
      estimation: EstimationEngine.calculate(input),
      generatedPlan: PlanEngine.generateFreePlan(input),
    });
  },
}));
