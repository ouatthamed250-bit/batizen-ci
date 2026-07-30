import { PlanEngine } from "@/services/PlanEngine";
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
  hasGarage: true,
  hasTerrace: true,
  hasGuestRoom: false,
};

describe("PlanEngine", () => {
  describe("generateFreePlan", () => {
    it("retourne un plan avec des pièces", () => {
      const plan = PlanEngine.generateFreePlan(baseInput);
      expect(plan).toBeDefined();
      expect(plan.rooms.length).toBeGreaterThan(0);
      expect(plan.title).toBeTruthy();
      expect(plan.totalBuiltAreaM2).toBeGreaterThan(0);
    });

    it("chaque pièce a les propriétés requises", () => {
      const plan = PlanEngine.generateFreePlan(baseInput);
      for (const room of plan.rooms) {
        expect(room).toHaveProperty("id");
        expect(room).toHaveProperty("label");
        expect(room).toHaveProperty("x");
        expect(room).toHaveProperty("y");
        expect(room).toHaveProperty("width");
        expect(room).toHaveProperty("height");
        expect(room).toHaveProperty("areaLabel");
        expect(room).toHaveProperty("fill");
      }
    });

    it("génère un SVG valide", () => {
      const plan = PlanEngine.generateFreePlan(baseInput);
      expect(plan.svg).toContain("<svg");
      expect(plan.svg).toContain("</svg>");
      expect(plan.svg).toContain("BÂTIZEN CI");
    });

    it("inclut des notes explicatives", () => {
      const plan = PlanEngine.generateFreePlan(baseInput);
      expect(plan.notes.length).toBeGreaterThan(0);
      expect(plan.notes[0]).toContain("Surface construite");
    });

    it("la surface construite est proportionnelle au terrain", () => {
      const petit = PlanEngine.generateFreePlan({ ...baseInput, landWidth: 10, landLength: 10 });
      const grand = PlanEngine.generateFreePlan({ ...baseInput, landWidth: 30, landLength: 30 });
      expect(grand.totalBuiltAreaM2).toBeGreaterThan(petit.totalBuiltAreaM2);
    });

    it("un étage augmente la surface construite", () => {
      const plainPied = PlanEngine.generateFreePlan({ ...baseInput, hasEtage: false });
      const avecEtage = PlanEngine.generateFreePlan({ ...baseInput, hasEtage: true });
      expect(avecEtage.totalBuiltAreaM2).toBeGreaterThan(plainPied.totalBuiltAreaM2);
    });

    it("plus de chambres = plus de pièces", () => {
      const petit = PlanEngine.generateFreePlan({ ...baseInput, bedrooms: 1 });
      const grand = PlanEngine.generateFreePlan({ ...baseInput, bedrooms: 6 });
      expect(grand.estimatedRooms).toBeGreaterThan(petit.estimatedRooms);
    });

    it("génère un plan pour chaque type de projet", () => {
      for (const type of ["base", "standard", "lux"] as const) {
        const plan = PlanEngine.generateFreePlan({ ...baseInput, type });
        expect(plan.rooms.length).toBeGreaterThan(0);
        expect(plan.totalBuiltAreaM2).toBeGreaterThan(0);
      }
    });

    it("chaque pièce a une surface positive", () => {
      const plan = PlanEngine.generateFreePlan(baseInput);
      for (const room of plan.rooms) {
        expect(room.width).toBeGreaterThan(0);
        expect(room.height).toBeGreaterThan(0);
      }
    });

    it("le garage est inclus quand demandé", () => {
      const avecGarage = PlanEngine.generateFreePlan({ ...baseInput, hasGarage: true });
      const labels = avecGarage.rooms.map((r) => r.label);
      expect(labels.some((l) => l.toLowerCase().includes("garage"))).toBe(true);
    });

    it("la terrasse est incluse quand demandée", () => {
      const avecTerrasse = PlanEngine.generateFreePlan({ ...baseInput, hasTerrace: true });
      const labels = avecTerrasse.rooms.map((r) => r.label);
      expect(labels.some((l) => l.toLowerCase().includes("terrasse"))).toBe(true);
    });
  });
});