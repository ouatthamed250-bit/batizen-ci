import type { GeneratedPlan, PlanInput, PlanRoom } from "@/types/batizen";

// ─── Palette pièces ────────────────────────────────────────────────────────
const ROOM_PALETTE = [
  "#EAF2FF", "#FFF2E8", "#EEFCE8", "#F4ECFF",
  "#E8FBFF", "#FFF7D6", "#FCE7F3", "#F0FFF4",
];
const ROOM_STROKE = [
  "#B8D4FF", "#FFD4A8", "#B8F0A8", "#D8C4FF",
  "#A8EEFF", "#FFE8A8", "#F8C4E4", "#C4FFD8",
];

// ─── Surface construite ────────────────────────────────────────────────────
function toBuiltArea(input: PlanInput): number {
  const landArea = input.landWidth * input.landLength;
  const coverage =
    input.landShape === "rectangulaire" ? 0.60 :
    input.landShape === "angle"         ? 0.55 : 0.50;
  const footprint = landArea * coverage;
  const builtArea = input.hasEtage ? footprint + footprint * 0.85 : footprint;
  return Math.max(60, Math.round(builtArea));
}

// ─── Programme architectural ───────────────────────────────────────────────
function buildProgram(input: PlanInput): Array<{ label: string; area: number }> {
  const rooms: Array<{ label: string; area: number }> = [];

  const masterArea  = input.type === "lux" ? 24 : input.type === "standard" ? 18 : 14;
  const bedroomArea = input.type === "lux" ? 16 : input.type === "standard" ? 13 : 11;
  const salonArea   = input.type === "lux" ? 36 : input.type === "standard" ? 28 : 22;
  const diningArea  = input.type === "lux" ? 18 : input.type === "standard" ? 14 : 10;
  const kitchenArea = input.kitchenType === "ouverte" ? 16 : input.kitchenType === "semi-ouverte" ? 14 : 12;
  const bathArea    = input.type === "lux" ? 8 : 6;

  rooms.push({ label: "Salon", area: salonArea + Math.max(0, input.livingRooms - 1) * 12 });
  if (input.hasDining) rooms.push({ label: "Salle à manger", area: diningArea });
  rooms.push({ label: "Cuisine", area: kitchenArea });
  rooms.push({ label: "Suite parentale", area: masterArea });
  for (let i = 2; i <= input.bedrooms; i++) rooms.push({ label: `Chambre ${i}`, area: bedroomArea });
  for (let i = 1; i <= input.bathrooms; i++) {
    rooms.push({ label: i === 1 ? "Salle d'eau parents" : `Salle d'eau ${i}`, area: bathArea });
  }
  if (input.hasOffice)    rooms.push({ label: "Bureau",         area: input.type === "lux" ? 14 : 10 });
  if (input.hasGuestRoom) rooms.push({ label: "Chambre invité", area: 12 });
  if (input.hasGarage)    rooms.push({ label: "Garage",         area: input.hasEtage ? 24 : 20 });
  if (input.hasTerrace)   rooms.push({ label: "Terrasse",       area: input.type === "lux" ? 20 : 14 });

  const totalProgramArea = rooms.reduce((s, r) => s + r.area, 0);
  rooms.push({ label: "Circulation", area: Math.max(8, Math.round(totalProgramArea * 0.12)) });
  if (input.hasEtage) rooms.push({ label: "Escalier", area: 9 });

  return rooms;
}

// ─── Layout 2D (plan de masse) ─────────────────────────────────────────────
function createLayout(
  program: Array<{ label: string; area: number }>,
  builtArea: number,
  input: PlanInput
): PlanRoom[] {
  const CANVAS_W = 820;
  const ZONE_X   = 50;
  const ZONE_Y   = 148;
  const ZONE_W   = 720;
  const ZONE_H   = 390;
  const GAP      = 8;
  const MIN_H    = 52;

  const rooms: PlanRoom[] = [];
  const DAY_LABELS = new Set(["Salon", "Salle à manger", "Cuisine", "Terrasse", "Garage", "Bureau"]);
  const dayRooms   = program.filter((r) => DAY_LABELS.has(r.label));
  const nightRooms = program.filter((r) => !DAY_LABELS.has(r.label));

  const dayH   = Math.round(ZONE_H * 0.44);
  const nightH = ZONE_H - dayH - GAP;
  const nightY = ZONE_Y + dayH + GAP;

  const dayTotal = dayRooms.reduce((s, r) => s + r.area, 0) || 1;
  let curX = ZONE_X;
  dayRooms.forEach((room, i) => {
    const isLast = i === dayRooms.length - 1;
    const rawW   = Math.round((room.area / dayTotal) * ZONE_W);
    const w      = isLast ? ZONE_X + ZONE_W - curX : Math.max(80, rawW - GAP);
    rooms.push({
      id: `day-${i}`, label: room.label,
      x: curX, y: ZONE_Y, width: w, height: dayH,
      areaLabel: `${room.area} m²`,
      fill: ROOM_PALETTE[i % ROOM_PALETTE.length],
    });
    curX += w + GAP;
  });

  const colW  = Math.round((ZONE_W - GAP) / 2);
  const cols  = [ZONE_X, ZONE_X + colW + GAP];
  const colYs = [nightY, nightY];

  nightRooms.forEach((room, i) => {
    const col    = i % 2;
    const x      = cols[col];
    const y      = colYs[col];
    const maxH   = nightY + nightH - y;
    const rawH   = Math.round((room.area / builtArea) * 220) + 20;
    const height = Math.min(Math.max(MIN_H, rawH), Math.max(MIN_H, maxH - GAP));
    if (y + height > ZONE_Y + ZONE_H) return;
    rooms.push({
      id: `night-${i}`, label: room.label,
      x, y, width: colW, height,
      areaLabel: `${room.area} m²`,
      fill: ROOM_PALETTE[(i + 3) % ROOM_PALETTE.length],
    });
    colYs[col] += height + GAP;
  });

  return rooms;
}

// ─── Rendu SVG pseudo-3D isométrique ──────────────────────────────────────
function renderSvg3D(rooms: PlanRoom[], input: PlanInput, builtArea: number): string {
  const orientationLabel: Record<string, string> = {
    nord: "↑ N", est: "→ E", sud: "↓ S", ouest: "← O",
  };

  const typeLabel =
    input.type === "lux"  ? "Modèle Héritage" :
    input.type === "base" ? "Modèle Essentiel" : "Modèle Équilibre";

  // Couleurs toiture selon qualité
  const roofColor =
    input.quality === "premium" ? "#C0392B" :
    input.quality === "standard" ? "#7F8C8D" : "#95A5A6";
  const roofDark =
    input.quality === "premium" ? "#922B21" :
    input.quality === "standard" ? "#5D6D7E" : "#717D7E";
  const wallColor =
    input.quality === "premium" ? "#FDFEFE" :
    input.quality === "standard" ? "#F8F9FA" : "#F0F3F4";
  const wallShadow =
    input.quality === "premium" ? "#D5D8DC" :
    input.quality === "standard" ? "#BFC9CA" : "#AAB7B8";

  // ── Projection isométrique ─────────────────────────────────────────────
  // On projette le plan 2D (820×620) en vue iso
  // Facteur de réduction pour tenir dans 820×700
  const ISO_SCALE  = 0.52;
  const WALL_H     = input.hasEtage ? 110 : 70;   // hauteur mur en px iso
  const ROOF_H     = input.type === "lux" ? 55 : 38;
  const OFFSET_X   = 410;  // centre horizontal
  const OFFSET_Y   = 260;  // ligne de sol

  // Transformation isométrique : (x,y) plan → (sx, sy) écran
  function iso(px: number, py: number): [number, number] {
    const sx = OFFSET_X + (px - py) * ISO_SCALE * 0.866;
    const sy = OFFSET_Y + (px + py) * ISO_SCALE * 0.5;
    return [Math.round(sx * 10) / 10, Math.round(sy * 10) / 10];
  }

  // ── Rendu des pièces en 3D ─────────────────────────────────────────────
  // Trier par profondeur (y+x décroissant = peindre les pièces du fond en premier)
  const sorted = [...rooms].sort((a, b) => (a.x + a.y) - (b.x + b.y));

  const roomNodes = sorted.map((room, idx) => {
    const x1 = room.x, y1 = room.y;
    const x2 = room.x + room.width, y2 = room.y + room.height;

    // 4 coins du sol
    const [ax, ay] = iso(x1, y1);
    const [bx, by] = iso(x2, y1);
    const [cx, cy] = iso(x2, y2);
    const [dx, dy] = iso(x1, y2);

    // Mur gauche (face ouest)
    const wallLeft = `${ax},${ay} ${ax},${ay - WALL_H} ${dx},${dy - WALL_H} ${dx},${dy}`;
    // Mur droit (face sud)
    const wallRight = `${bx},${by} ${bx},${by - WALL_H} ${cx},${cy - WALL_H} ${cx},${cy}`;
    // Toit (face supérieure)
    const roofTop = `${ax},${ay - WALL_H} ${bx},${by - WALL_H} ${cx},${cy - WALL_H} ${dx},${dy - WALL_H}`;

    const fill  = ROOM_PALETTE[idx % ROOM_PALETTE.length];
    const stroke = ROOM_STROKE[idx % ROOM_STROKE.length];

    // Centre du toit pour le label
    const labelX = (ax + bx + cx + dx) / 4;
    const labelY = (ay + by + cy + dy) / 4 - WALL_H - 6;
    const showArea = room.height >= 60;

    return `
    <g>
      <!-- Sol -->
      <polygon points="${ax},${ay} ${bx},${by} ${cx},${cy} ${dx},${dy}"
        fill="${fill}" stroke="${stroke}" stroke-width="1.2"/>
      <!-- Mur gauche -->
      <polygon points="${wallLeft}" fill="${wallShadow}" stroke="${stroke}" stroke-width="1"/>
      <!-- Mur droit -->
      <polygon points="${wallRight}" fill="${wallColor}" stroke="${stroke}" stroke-width="1"/>
      <!-- Toit -->
      <polygon points="${roofTop}" fill="${fill}" stroke="${stroke}" stroke-width="1.5" opacity="0.92"/>
      <!-- Label -->
      <text x="${labelX}" y="${labelY}"
        text-anchor="middle" font-family="Arial,sans-serif" font-size="11" font-weight="700" fill="#0D2B6B">
        ${room.label}
      </text>
      ${showArea ? `<text x="${labelX}" y="${labelY + 14}"
        text-anchor="middle" font-family="Arial,sans-serif" font-size="9" fill="#6B7280">
        ${room.areaLabel}
      </text>` : ""}
    </g>`;
  }).join("");

  // ── Toiture principale (enveloppe globale) ─────────────────────────────
  const allX1 = Math.min(...rooms.map(r => r.x));
  const allY1 = Math.min(...rooms.map(r => r.y));
  const allX2 = Math.max(...rooms.map(r => r.x + r.width));
  const allY2 = Math.max(...rooms.map(r => r.y + r.height));
  const midX  = (allX1 + allX2) / 2;

  const [r1x, r1y] = iso(allX1, allY1);
  const [r2x, r2y] = iso(allX2, allY1);
  const [r3x, r3y] = iso(allX2, allY2);
  const [r4x, r4y] = iso(allX1, allY2);
  const [ridgeX, ridgeY] = iso(midX, (allY1 + allY2) / 2);

  const roofBase = WALL_H + 2;
  const ridgePeak = roofBase + ROOF_H;

  const roofFaceLeft  = `${r1x},${r1y - roofBase} ${ridgeX},${ridgeY - ridgePeak} ${r4x},${r4y - roofBase}`;
  const roofFaceRight = `${r2x},${r2y - roofBase} ${ridgeX},${ridgeY - ridgePeak} ${r3x},${r3y - roofBase}`;
  const roofFaceFront = `${r1x},${r1y - roofBase} ${r2x},${r2y - roofBase} ${ridgeX},${ridgeY - ridgePeak}`;
  const roofFaceBack  = `${r4x},${r4y - roofBase} ${r3x},${r3y - roofBase} ${ridgeX},${ridgeY - ridgePeak}`;

  // ── Étage indicator ────────────────────────────────────────────────────
  const etageLabel = input.hasEtage
    ? `<rect x="640" y="38" width="120" height="26" rx="8" fill="#0B5FFF"/>
       <text x="700" y="56" text-anchor="middle" font-family="Arial,sans-serif" font-size="12" font-weight="700" fill="#FFF">R+1</text>`
    : `<rect x="640" y="38" width="120" height="26" rx="8" fill="#22C55E"/>
       <text x="700" y="56" text-anchor="middle" font-family="Arial,sans-serif" font-size="12" font-weight="700" fill="#FFF">Plain-pied</text>`;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="820" height="700" viewBox="0 0 820 700">
  <defs>
    <linearGradient id="bgGrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#EAF2FF"/>
      <stop offset="100%" stop-color="#FAFCFF"/>
    </linearGradient>
    <filter id="shadow" x="-10%" y="-10%" width="120%" height="130%">
      <feDropShadow dx="0" dy="4" stdDeviation="6" flood-color="#0D2B6B" flood-opacity="0.12"/>
    </filter>
  </defs>

  <!-- Fond -->
  <rect width="820" height="700" rx="32" fill="url(#bgGrad)"/>
  <rect x="18" y="18" width="784" height="664" rx="24" fill="#FAFCFF" stroke="#E7EBF5" stroke-width="1.5"/>

  <!-- Header -->
  <rect x="34" y="34" width="752" height="44" rx="14" fill="#0D2B6B"/>
  <text x="56" y="62" font-family="Arial,sans-serif" font-size="15" font-weight="700" fill="#FFFFFF">BÂTIZEN CI — Vue 3D Gratuite</text>
  <text x="580" y="62" text-anchor="end" font-family="Arial,sans-serif" font-size="13" font-weight="700" fill="#FFB15E">${orientationLabel[input.orientation] ?? "↑ N"}</text>
  ${etageLabel}

  <!-- Infos -->
  <text x="50" y="100" font-family="Arial,sans-serif" font-size="13" font-weight="700" fill="#0D2B6B">${typeLabel} • ${builtArea} m² • ${input.location}</text>
  <text x="50" y="118" font-family="Arial,sans-serif" font-size="11" fill="#6B7280">Terrain ${input.landWidth}m × ${input.landLength}m • ${input.bedrooms} ch. • ${input.bathrooms} sdb • Qualité ${input.quality}</text>

  <!-- Sol / terrain -->
  <ellipse cx="410" cy="${OFFSET_Y + 30}" rx="340" ry="60" fill="#E8F5E9" opacity="0.6"/>

  <!-- Pièces 3D -->
  <g filter="url(#shadow)">
    ${roomNodes}
  </g>

  <!-- Toiture principale -->
  <g opacity="0.88">
    <polygon points="${roofFaceBack}"  fill="${roofDark}"  stroke="#888" stroke-width="1"/>
    <polygon points="${roofFaceLeft}"  fill="${roofDark}"  stroke="#888" stroke-width="1"/>
    <polygon points="${roofFaceRight}" fill="${roofColor}" stroke="#888" stroke-width="1"/>
    <polygon points="${roofFaceFront}" fill="${roofColor}" stroke="#888" stroke-width="1.5"/>
  </g>

  <!-- Légende qualité -->
  <rect x="34" y="648" width="752" height="28" rx="10" fill="#FFF4EA" stroke="#FFD6AE" stroke-width="1"/>
  <text x="50" y="666" font-family="Arial,sans-serif" font-size="10" font-weight="700" fill="#FF7A00">Vue 3D conceptuelle gratuite — Qualité ${input.quality} • ${input.type} • À valider par un architecte BÂTIZEN CI.</text>
</svg>`;
}

// ─── Export public ─────────────────────────────────────────────────────────
export const PlanEngine = {
  generateFreePlan(input: PlanInput): GeneratedPlan {
    const totalBuiltAreaM2 = toBuiltArea(input);
    const program          = buildProgram(input);
    const rooms            = createLayout(program, totalBuiltAreaM2, input);
    const svg              = renderSvg3D(rooms, input, totalBuiltAreaM2);

    return {
      id:               `free-${Date.now().toString(36)}`,
      title:            "Vue 3D intelligente gratuite",
      description:      "Rendu pseudo-3D calculé à partir du terrain, du programme, de la qualité et du style choisis.",
      totalBuiltAreaM2,
      estimatedRooms:   rooms.length,
      rooms,
      svg,
      notes: [
        `Surface construite estimée : ${totalBuiltAreaM2} m² sur ${input.landWidth * input.landLength} m² de terrain.`,
        `Programme : ${input.bedrooms} chambre(s), ${input.bathrooms} salle(s) d'eau, cuisine ${input.kitchenType.replace("-", " ")}.`,
        `${input.hasEtage ? "Répartition R+1 avec escalier intégré." : "Organisation plain-pied optimisée."}`,
        `Toiture et volumes calculés selon la qualité "${input.quality}" et le modèle "${input.type}".`,
      ],
    };
  },

  getPremiumPlans() {
    return [
      { id: "p1", title: "Plan d'exécution complet",  price: 150_000, description: "Plans techniques cotés, coupes, élévations, structure et plomberie." },
      { id: "p2", title: "Villa Prestige 3D HD",       price: 300_000, description: "Rendu 3D premium, dossier permis, matériaux recommandés et optimisation budget." },
      { id: "p3", title: "Optimisé petit terrain",     price:  50_000, description: "Réinterprétation compacte pour forte rentabilité des petites parcelles." },
    ];
  },
};
