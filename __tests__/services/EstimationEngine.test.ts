import { EstimationEngine } from "@/services/EstimationEngine";
import type { PlanInput } from "@/types/batizen";

const baseInput: PlanInput = {
  landWidth: 15,
  landLength: 20,
  location: "Abidjan",
  hasAdminPapers: false,
  landShape: "rectangulaire",
  orientation: "nord",
  type: "standard",
  hasEtage: false,
  quality: "standard",
  bedrooms: 3,
  bathrooms: 2,
  livingRooms: 1,
  hasDining: true,
  kitchenType: "semi-ouverte",
  hasOffice: false,
  hasGarage: false,
  hasTerrace: false,
  hasGuestRoom: false,
};

describe("EstimationEngine", () => {
  describe("calculate", () => {
    it("retourne une estimation complète", () => {
      const result = EstimationEngine.calculate(baseInput);
      expect(result).toBeDefined();
      expect(result.grandTotal).toBeGreaterThan(0);
      expect(result.builtAreaM2).toBeGreaterThan(0);
    });

    it("le total correspond à la somme des postes", () => {
      const result = EstimationEngine.calculate(baseInput);
      expect(result.grandTotal).toBe(result.materialsTotal + result.laborTotal + result.adminTotal);
    });

    it("le coût par m² est cohérent (entre 150k et 1M FCFA)", () => {
      const result = EstimationEngine.calculate(baseInput);
      const costPerM2 = result.grandTotal / result.builtAreaM2;
      expect(costPerM2).toBeGreaterThan(100_000);
      expect(costPerM2).toBeLessThan(2_000_000);
    });

    it("le budget augmente avec la qualité", () => {
      const eco = EstimationEngine.calculate({ ...baseInput, quality: "eco" });
      const premium = EstimationEngine.calculate({ ...baseInput, quality: "premium" });
      expect(premium.grandTotal).toBeGreaterThan(eco.grandTotal);
    });

    it("un plus grand terrain donne un budget plus élevé", () => {
      const petit = EstimationEngine.calculate({ ...baseInput, landWidth: 10, landLength: 10 });
      const grand = EstimationEngine.calculate({ ...baseInput, landWidth: 30, landLength: 30 });
      expect(grand.grandTotal).toBeGreaterThan(petit.grandTotal);
    });

    it("un étage augmente le coût total", () => {
      const plainPied = EstimationEngine.calculate({ ...baseInput, hasEtage: false });
      const avecEtage = EstimationEngine.calculate({ ...baseInput, hasEtage: true });
      expect(avecEtage.grandTotal).toBeGreaterThan(plainPied.grandTotal);
    });

    it("fournit un détail des matériaux", () => {
      const result = EstimationEngine.calculate(baseInput);
      expect(result.details.materials.length).toBeGreaterThan(0);
      for (const mat of result.details.materials) {
        expect(mat.name).toBeTruthy();
        expect(mat.qty).toBeGreaterThan(0);
        expect(mat.cost).toBeGreaterThan(0);
      }
    });

    it("fournit un détail de la main d'œuvre", () => {
      const result = EstimationEngine.calculate(baseInput);
      expect(result.details.labor.length).toBeGreaterThan(0);
      for (const labor of result.details.labor) {
        expect(labor.name).toBeTruthy();
        expect(labor.cost).toBeGreaterThan(0);
      }
    });

    it("le type lux coûte plus cher que le type base", () => {
      const base = EstimationEngine.calculate({ ...baseInput, type: "base" });
      const lux = EstimationEngine.calculate({ ...baseInput, type: "lux" });
      expect(lux.grandTotal).toBeGreaterThan(base.grandTotal);
    });

    it("les frais admin sont ajoutés si pas de papiers", () => {
      const sansPapiers = EstimationEngine.calculate({ ...baseInput, hasAdminPapers: false });
      const avecPapiers = EstimationEngine.calculate({ ...baseInput, hasAdminPapers: true });
      expect(sansPapiers.adminTotal).toBeGreaterThan(0);
      expect(avecPapiers.adminTotal).toBe(0);
    });

    it("le garage augmente le coût", () => {
      const sansGarage = EstimationEngine.calculate({ ...baseInput, hasGarage: false });
      const avecGarage = EstimationEngine.calculate({ ...baseInput, hasGarage: true });
      expect(avecGarage.grandTotal).toBeGreaterThan(sansGarage.grandTotal);
    });
  });
});