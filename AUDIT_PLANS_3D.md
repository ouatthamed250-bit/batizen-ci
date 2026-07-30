# 🏗️ AUDIT COMPLET — Système de génération de plans 3D

---

## 📁 Fichier 1 : `src/types/batizen.ts` — Types

```typescript
export type ProjectType = "base" | "standard" | "lux";
export type QualityType = "eco" | "standard" | "premium";
export type LandShape = "rectangulaire" | "angle" | "allonge";
export type Orientation = "nord" | "est" | "sud" | "ouest";
export type KitchenType = "ouverte" | "semi-ouverte" | "fermee";

export type PlanInput = {
  landWidth: number;
  landLength: number;
  location: string;
  hasAdminPapers: boolean;
  landShape: LandShape;
  orientation: Orientation;
  type: ProjectType;
  hasEtage: boolean;
  quality: QualityType;
  bedrooms: number;
  bathrooms: number;
  livingRooms: number;
  hasDining: boolean;
  kitchenType: KitchenType;
  hasOffice: boolean;
  hasGarage: boolean;
  hasTerrace: boolean;
  hasGuestRoom: boolean;
};

export type PlanRoom = {
  id: string;
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
  areaLabel: string;
  fill: string;
};

export type GeneratedPlan = {
  id: string;
  title: string;
  description: string;
  totalBuiltAreaM2: number;
  estimatedRooms: number;
  rooms: PlanRoom[];
  svg: string;
  notes: string[];
};
```

**Types propres, exhaustifs.**

---

## 📁 Fichier 2 : `src/services/PlanEngine.ts` — Moteur de génération (316 lignes)

### Fonctionnement :

1. **`toBuiltArea(input)`** — Calcule la surface construite selon la forme du terrain (rectangulaire → 60%, angle → 55%, allongé → 50%) et l'étage (+85% d'emprise)
2. **`buildProgram(input)`** — Génère le programme architectural (liste des pièces avec surfaces) basé sur tous les paramètres (type, qualité, chambres, etc.)
3. **`createLayout(program, builtArea, input)`** — Positionne les pièces en 2D sur un canevas, séparées en zone jour/nuit
4. **`renderSvg3D(rooms, input, builtArea)`** — Prend les pièces 2D et fait une projection isométrique → SVG 3D

### `generateFreePlan(input)` retourne un objet `GeneratedPlan` avec :
- `totalBuiltAreaM2` : surface calculée selon le terrain
- `rooms` : liste des pièces avec coordonnées 2D
- `svg` : chaîne SVG complète de la vue 3D isométrique
- `notes` : description textuelle

### ✅ Ce moteur **GÉNÈRE DYNAMIQUEMENT** un plan différent pour chaque input

---

## 📁 Fichier 3 : `src/services/EstimationEngine.ts`

```typescript
import type { PlanInput } from "@/types/batizen";

export type EstimationResult = {
  totalCostFcfa: number;
  costPerM2: number;
  constructionMonths: number;
  breakdown: {
    foundation: { label: string; percent: number; cost: number };
    structure: { label: string; percent: number; cost: number };
    roof: { label: string; percent: number; cost: number };
    finishing: { label: string; percent: number; cost: number };
    plumbing: { label: string; percent: number; cost: number };
    electrical: { label: string; percent: number; cost: number };
  };
};

const BASE_COST_PER_M2: Record<string, number> = {
  eco: 250_000,
  standard: 400_000,
  premium: 650_000,
};

export const EstimationEngine = {
  calculate(input: PlanInput): EstimationResult {
    const base = BASE_COST_PER_M2[input.quality] || 400_000;
    const landArea = input.landWidth * input.landLength;
    // ...
    const totalCost = Math.max(5_000_000, Math.round(estimatedBuiltArea * costPerM2));
    // ...
    return { totalCostFcfa, costPerM2, constructionMonths, breakdown };
  },
};
```

**Moteur d'estimation fonctionnel et dynamique.**

---

## 📁 Fichier 4 : `src/components/simulation/PlanGenerator3D.tsx` — Composant Three.js

```typescript
interface Plan3DProps {
  surface: number;
  largeur: number;
  longueur: number;
  chambres: number;
  sallesDeBain: number;
  etages: number;
  garage: boolean;
  piscine: boolean;
  style: string;
}
```

### Le composant `House` interne :

- **Sol** : boxGeometry verte `(buildingWidth + 10, 0.2, buildingLength + 10)` → toujours 10m plus large/long que la maison
- **Murs** : boxGeometry `(buildingWidth, buildingHeight, buildingLength)` — un seul parallélépipède pour tout le volume
- **Fenêtres** : placées sur la face avant, calculées selon `chambres` et `etages` (max 4 fenêtres par étage)
- **Toit** : selon style → `Moderne` = toit plat (boîte grise), sinon cône pyramide
- **Garage** : boîte grise à gauche
- **Piscine** : boîte bleue à droite

### Ce que le composant ne fait PAS :

| Élément | Statut |
|---------|--------|
| Pièces individuelles (salon, chambres, cuisine) | ❌ Une seule boîte blanche |
| Couleurs différentes par pièce | ❌ |
| Murs intérieurs | ❌ |
| Portes | ❌ |
| Étage séparé visuellement | ❌ (juste une hauteur plus grande) |
| Toit en pente réaliste | ❌ (cône basique) |
| Terrasse | ❌ |
| Orientation du terrain | ❌ |
| Fenêtres positionnées selon les vraies pièces | ❌ (calcul approximatif) |

---

## 📁 Fichier 5 : `src/components/simulation/PlanGenerator2D.tsx`

```typescript
"use client";
import type { GeneratedPlan } from "@/types/batizen";

export default function PlanGenerator2D({
  plan,
}: {
  plan: GeneratedPlan;
}) {
  return (
    <div className="w-full max-w-3xl mx-auto">
      <div
        className="w-full overflow-auto rounded-2xl border border-white/20 bg-white shadow-xl"
        dangerouslySetInnerHTML={{ __html: plan.svg }}
      />
    </div>
  );
}
```

**Simple conteneur SVG. Rien de plus.**

---

## 📁 Fichier 6 : `src/stores/simulationStore.ts`

```typescript
export const useSimulationStore = create<SimulationState>((set, get) => ({
  // ... defaults
  runCalculation: () => {
    const state = get();
    const input: PlanInput = { /* ... toutes les props */ };
    set({
      estimation: EstimationEngine.calculate(input),
      generatedPlan: PlanEngine.generateFreePlan(input),
    });
  },
}));
```

**Store propre, appelle PlanEngine avec les inputs.**

---

## 📁 Fichier 7 : `src/app/simulation/page.tsx`

```typescript
"use client";
import { useState } from "react";
import { useSimulationStore } from "@/stores/simulationStore";
import PlanGenerator3D from "@/components/simulation/PlanGenerator3D";
import PlanGenerator2D from "@/components/simulation/PlanGenerator2D";
import ChatBot from "@/components/ChatBot";

export default function SimulationPage() {
  const { landWidth, landLength, location, bedrooms, bathrooms, hasEtage, hasGarage, hasTerrace, type, quality, setConfig, runCalculation, estimation, generatedPlan } = useSimulationStore();
  const [viewMode, setViewMode] = useState<"2d" | "3d">("3d");

  const handleSimulate = () => {
    runCalculation();
  };

  return (
    <div>
      {/* Formulaire d'inputs */}
      <input value={landWidth} onChange={e => setConfig({ landWidth: +e.target.value })} />
      <input value={landLength} onChange={e => setConfig({ landLength: +e.target.value })} />
      <select value={type} onChange={e => setConfig({ type: e.target.value as any })}>...</select>
      {/* ... autres inputs ... */}
      
      <button onClick={handleSimulate}>Simuler</button>

      {generatedPlan && viewMode === "3d" && (
        <PlanGenerator3D
          surface={generatedPlan.totalBuiltAreaM2}
          largeur={landWidth}
          longueur={landLength}
          chambres={bedrooms}
          sallesDeBain={bathrooms}
          etages={hasEtage ? 2 : 1}
          garage={hasGarage}
          piscine={false}
          style={type === "lux" ? "Moderne" : "Classique"}
        />
      )}

      {generatedPlan && viewMode === "2d" && (
        <PlanGenerator2D plan={generatedPlan} />
      )}
      
      {estimation && (
        <div>Estimation: {estimation.totalCostFcfa.toLocaleString()} FCFA</div>
      )}

      <ChatBot />
    </div>
  );
}
```

---

## 📊 DIAGNOSTIC FONCTIONNEL

### 🟢 Ce qui fonctionne

| Élément | Statut |
|---------|--------|
| `PlanEngine.generateFreePlan(input)` | ✅ Génère un plan 2D+SVG UNIQUE selon tous les inputs |
| `EstimationEngine.calculate(input)` | ✅ Calcule un budget UNIQUE selon qualité, surface, etc. |
| Vue 2D (SVG) | ✅ Affiche le SVG généré — changement de pièces, couleurs, disposition |
| Vue 3D Three.js | ✅ Rendu 3D fonctionnel avec OrbitControls, rotation auto |

### 🟡 Ce qui est en dur / statique

| Élément | Statut |
|---------|--------|
| `PlanGenerator3D.tsx` utilise ses propres calculs | 🟡 Ne reçoit que `surface`, `largeur`, `longueur`, `chambres` — PAS les plans de pièces individuelles |
| `PlanGenerator3D` dessine UN BLOC UNIQUE | 🟡 Une seule boîte `boxGeometry(buildingWidth, buildingHeight, buildingLength)` pour toute la maison |
| Couleur selon `style` uniquement | 🟡 `getHouseColor(style)` → blanc/beige/marron, pas de mapping avec les vraies pièces |
| Garage et piscine sont des options booléennes | 🟡 Mais pas de positionnement intelligent selon le terrain |
| `piscine={false}` en dur dans la page | 🟡 L'input utilisateur pour la piscine n'existe pas dans l'UI |

### 🔴 Ce qui est cassé / manquant

| Élément | Statut |
|---------|--------|
| **DÉCONNEXION** entre `PlanEngine` et `PlanGenerator3D` | 🔴 **PlanEngine génère des pièces individuelles avec coordonnées 2D, mais PlanGenerator3D ne les utilise PAS** — il refait ses propres calculs à partir de 4 paramètres de base |
| `null!` sur `houseRef` | 🔴 `const houseRef = useRef<Mesh>(null!);` — assertion non-null dangereuse |
| `PlanGenerator3D` n'accepte pas les `PlanRoom[]` | 🔴 Interface `Plan3DProps` ne contient pas les données de `PlanEngine` |
| La même villa qui tourne | 🔴 **Quels que soient les inputs, Three.js dessine toujours le même parallélépipède avec ± de fenêtres** |
| Pas de mapping `PlanRoom[].svg` → Three.js | 🔴 Les vraies données de plan (salon, chambres, cuisine avec leurs positions) ne sont pas transmises au composant 3D |

---

## 🔬 EXPLICATION DU PROBLÈME

```
┌─────────────────────┐
│  simulationStore    │
│  PlanEngine         │───→ SVG (plan 2D CORRECT avec pièces)
│  generateFreePlan() │
└─────────────────────┘
         │
         │ Les coordonnées des pièces (rooms[]) sont IGNORÉES
         ▼
┌─────────────────────┐
│  PlanGenerator3D    │───→ Rendu Three.js (même boîte blanche)
│                     │     Ne reçoit QUE : surface, largeur,
│                     │     longueur, chambres, étages
└─────────────────────┘
```

**Le SVG (`PlanEngine`) est dynamique et correct.** Le problème est que `PlanGenerator3D` ne branche pas sur les données générées par `PlanEngine`. Il recrée un modèle simpliste avec ses propres calculs.

### Solution (si demandée)

`PlanGenerator3D` devrait recevoir les `PlanRoom[]` (les pièces avec coordonnées x,y,width,height) et les transformer en géométries Three.js individuelles (un boxGeometry par pièce avec sa couleur), plutôt que de dessiner un seul bloc vide.