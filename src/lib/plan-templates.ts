// Templates SVG de plans paramétrés BTP CI
// Chaque template est une string avec placeholders {SURFACE}, {CHAMBRES}, {DATE}, {TOITURE}

const HEADER_SVG = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="820" height="620" viewBox="0 0 820 620">
  <defs>
    <style>
      .wall { fill: none; stroke: #0D2B6B; stroke-width: 2.5; }
      .wall-thick { fill: none; stroke: #0D2B6B; stroke-width: 4; }
      .hatch { fill: url(#hatchPattern); stroke: #0D2B6B; stroke-width: 0.5; }
      .dim { fill: #6B7280; font-family: Arial, sans-serif; font-size: 9px; text-anchor: middle; }
      .label { fill: #0D2B6B; font-family: Arial, sans-serif; font-size: 11px; font-weight: bold; text-anchor: middle; }
      .title { fill: #0D2B6B; font-family: Arial, sans-serif; font-size: 14px; font-weight: bold; }
      .window { fill: none; stroke: #87CEEB; stroke-width: 1.5; }
      .door { fill: none; stroke: #8B4513; stroke-width: 1.5; }
    </style>
    <pattern id="hatchPattern" width="6" height="6" patternUnits="userSpaceOnUse">
      <line x1="0" y1="6" x2="6" y2="0" stroke="#E5E7EB" stroke-width="0.5"/>
    </pattern>
    <linearGradient id="bgGrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#F9FAFB"/>
      <stop offset="100%" stop-color="#F3F4F6"/>
    </linearGradient>
  </defs>
  <rect width="820" height="620" fill="url(#bgGrad)" rx="12"/>
  <rect x="15" y="15" width="790" height="590" fill="white" stroke="#E5E7EB" stroke-width="1" rx="8"/>
  
  <!-- Header bar -->
  <rect x="30" y="30" width="760" height="40" rx="8" fill="#0D2B6B"/>
  <text x="50" y="56" class="title" fill="white">BÂTIZEN CI — Plan architectural standard</text>
  <text x="770" y="56" text-anchor="end" class="title" fill="#FF7A00" font-size="11">{DATE}</text>
  
  <!-- Info box -->
  <text x="50" y="95" class="label" font-size="12">Surface: {SURFACE} m² · {CHAMBRES} pièces · Toiture: {TOITURE}</text>
  <text x="50" y="112" class="dim" font-size="9">Échelle 1:100 · Plan indicatif — Pour un plan d'exécution, contactez un architecte agréé</text>
  
  <!-- Scale bar -->
  <line x1="50" y1="590" x2="150" y2="590" stroke="#0D2B6B" stroke-width="2"/>
  <line x1="50" y1="586" x2="50" y2="594" stroke="#0D2B6B" stroke-width="1.5"/>
  <line x1="100" y1="586" x2="100" y2="590" stroke="#0D2B6B" stroke-width="1.5"/>
  <line x1="150" y1="586" x2="150" y2="594" stroke="#0D2B6B" stroke-width="1.5"/>
  <text x="50" y="582" class="dim" font-size="8">0</text>
  <text x="100" y="582" class="dim" font-size="8">5m</text>
  <text x="150" y="582" class="dim" font-size="8">10m</text>
  
  <!-- North arrow -->
  <g transform="translate(750, 98)">
    <polygon points="0,18 6,0 12,18 0,18" fill="#0D2B6B"/>
    <polygon points="0,18 6,0 6,18 0,18" fill="#FF7A00"/>
    <text x="6" y="30" class="label" font-size="9">N</text>
  </g>`;

const FOOTER_SVG = `
  <!-- Legend -->
  <rect x="280" y="570" width="260" height="30" rx="6" fill="#F9FAFB" stroke="#E5E7EB" stroke-width="0.5"/>
  <text x="290" y="588" class="dim" font-size="8">⚪ Mur extérieur  ·  ⚪ Cloison  ·  ⚪ Fenêtre  ·  ⚪ Porte</text>
</svg>`;

function makeWalls(w: number, h: number, rooms: { name: string; x: number; y: number; w: number; h: number }[]): string {
  let svg = '';
  // Outer walls
  svg += `<rect x="${100}" y="${150}" width="${w}" height="${h}" class="wall-thick"/>`;
  // Room walls
  rooms.forEach(r => {
    svg += `<rect x="${r.x}" y="${r.y}" width="${r.w}" height="${r.h}" class="wall"/>`;
    // Room label
    svg += `<text x="${r.x + r.w / 2}" y="${r.y + r.h / 2 + 4}" class="label">${r.name}</text>`;
  });
  return svg;
}

function makeWindows(x: number, y: number, w: number, h: number, count: number = 2): string {
  let svg = '';
  for (let i = 0; i < count; i++) {
    const wx = x + 20 + i * (w - 40) / count;
    svg += `<line x1="${wx}" y1="${y}" x2="${wx}" y2="${y + 12}" class="window"/>`;
    svg += `<line x1="${wx + 6}" y1="${y}" x2="${wx + 6}" y2="${y + 12}" class="window"/>`;
  }
  return svg;
}

function makeDoors(x: number, y: number, side: 'top' | 'bottom' | 'left' | 'right'): string {
  const ox = side === 'left' ? x : side === 'right' ? x : x + 5;
  const oy = side === 'top' ? y + 12 : side === 'bottom' ? y - 8 : y + 5;
  const dx = side === 'left' || side === 'right' ? 0 : 12;
  const dy = side === 'top' || side === 'bottom' ? 0 : 12;
  return `<path d="M ${x} ${y} Q ${ox} ${oy} ${x + dx} ${y + dy}" class="door"/>`;
}

// Template T2 RDC (2 pièces + salon/cuisine)
export const T2_RDC = (s: number, toit: string) => {
  const scale = Math.sqrt(s / 60);
  const bw = Math.round(280 * scale);
  const bh = Math.round(220 * scale);
  const rooms = [
    { name: "Salon", x: 110, y: 160, w: Math.round(bw * 0.45), h: Math.round(bh * 0.55) },
    { name: "Chambre", x: 110 + Math.round(bw * 0.50), y: 160, w: Math.round(bw * 0.45), h: Math.round(bh * 0.55) },
    { name: "Cuisine", x: 110, y: 160 + Math.round(bh * 0.6), w: Math.round(bw * 0.4), h: Math.round(bh * 0.35) },
    { name: "Salle d'eau", x: 110 + Math.round(bw * 0.45), y: 160 + Math.round(bh * 0.6), w: Math.round(bw * 0.3), h: Math.round(bh * 0.35) },
  ];
  return `${HEADER_SVG.replace('{SURFACE}', String(s)).replace('{CHAMBRES}', 'T2').replace('{DATE}', new Date().toLocaleDateString('fr-FR')).replace('{TOITURE}', toit)}
  ${makeWalls(bw, bh, rooms)}
  ${makeWindows(100, 150, bw, bh, 2)}
  ${makeDoors(100 + bw / 2, 150 + bh, 'top')}
  ${makeDoors(100, 150 + bh / 2, 'left')}
  ${FOOTER_SVG}`;
};

// Template T3 RDC
export const T3_RDC = (s: number, toit: string) => {
  const scale = Math.sqrt(s / 80);
  const bw = Math.round(320 * scale);
  const bh = Math.round(240 * scale);
  const rooms = [
    { name: "Salon", x: 110, y: 160, w: Math.round(bw * 0.45), h: Math.round(bh * 0.5) },
    { name: "Cuisine", x: 110 + Math.round(bw * 0.50), y: 160, w: Math.round(bw * 0.45), h: Math.round(bh * 0.5) },
    { name: "Ch. 1", x: 110, y: 160 + Math.round(bh * 0.55), w: Math.round(bw * 0.3), h: Math.round(bh * 0.4) },
    { name: "Ch. 2", x: 110 + Math.round(bw * 0.35), y: 160 + Math.round(bh * 0.55), w: Math.round(bw * 0.3), h: Math.round(bh * 0.4) },
    { name: "SdB", x: 110 + Math.round(bw * 0.70), y: 160 + Math.round(bh * 0.55), w: Math.round(bw * 0.25), h: Math.round(bh * 0.4) },
  ];
  return `${HEADER_SVG.replace('{SURFACE}', String(s)).replace('{CHAMBRES}', 'T3').replace('{DATE}', new Date().toLocaleDateString('fr-FR')).replace('{TOITURE}', toit)}
  ${makeWalls(bw, bh, rooms)}
  ${makeWindows(100, 150, bw, bh, 3)}
  ${makeDoors(100 + bw / 2, 150 + bh, 'top')}
  ${FOOTER_SVG}`;
};

// Template T4 RDC
export const T4_RDC = (s: number, toit: string) => {
  const scale = Math.sqrt(s / 100);
  const bw = Math.round(360 * scale);
  const bh = Math.round(260 * scale);
  const rooms = [
    { name: "Salon", x: 110, y: 160, w: Math.round(bw * 0.4), h: Math.round(bh * 0.5) },
    { name: "Cuisine", x: 110 + Math.round(bw * 0.45), y: 160, w: Math.round(bw * 0.5), h: Math.round(bh * 0.5) },
    { name: "Ch. 1", x: 110, y: 160 + Math.round(bh * 0.55), w: Math.round(bw * 0.3), h: Math.round(bh * 0.4) },
    { name: "Ch. 2", x: 110 + Math.round(bw * 0.35), y: 160 + Math.round(bh * 0.55), w: Math.round(bw * 0.3), h: Math.round(bh * 0.4) },
    { name: "Ch. 3", x: 110 + Math.round(bw * 0.70), y: 160 + Math.round(bh * 0.55), w: Math.round(bw * 0.25), h: Math.round(bh * 0.4) },
  ];
  return `${HEADER_SVG.replace('{SURFACE}', String(s)).replace('{CHAMBRES}', 'T4').replace('{DATE}', new Date().toLocaleDateString('fr-FR')).replace('{TOITURE}', toit)}
  ${makeWalls(bw, bh, rooms)}
  ${makeWindows(100, 150, bw, bh, 3)}
  ${makeDoors(100 + bw / 2, 150 + bh, 'top')}
  ${FOOTER_SVG}`;
};

// Studio RDC
export const Studio_RDC = (s: number, toit: string) => {
  const scale = Math.sqrt(s / 30);
  const bw = Math.round(200 * scale);
  const bh = Math.round(160 * scale);
  const rooms = [
    { name: "Séjour/Cuisine", x: 110, y: 160, w: Math.round(bw * 0.45), h: Math.round(bh * 0.55) },
    { name: "Chambre", x: 110 + Math.round(bw * 0.50), y: 160, w: Math.round(bw * 0.45), h: Math.round(bh * 0.55) },
    { name: "Salle d'eau", x: 110, y: 160 + Math.round(bh * 0.6), w: Math.round(bw * 0.35), h: Math.round(bh * 0.35) },
  ];
  return `${HEADER_SVG.replace('{SURFACE}', String(s)).replace('{CHAMBRES}', 'Studio').replace('{DATE}', new Date().toLocaleDateString('fr-FR')).replace('{TOITURE}', toit)}
  ${makeWalls(bw, bh, rooms)}
  ${makeWindows(100, 150, bw, bh, 1)}
  ${makeDoors(100 + bw / 2, 150 + bh, 'top')}
  ${FOOTER_SVG}`;
};

// T3 R+1
export const T3_R1 = (s: number, toit: string) => {
  const t2 = T3_RDC(s / 2, toit);
  return t2.replace('T3', 'T3 R+1').replace('<!-- Grid', `<!-- Etage -->\n  <rect x="30" y="560" width="80" height="22" rx="6" fill="#22C55E"/>\n  <text x="70" y="575" class="label" fill="white" font-size="10">R+1</text>\n  <!-- Grid`);
};

// T4 R+1
export const T4_R1 = (s: number, toit: string) => {
  const t4 = T4_RDC(s / 2, toit);
  return t4.replace('T4', 'T4 R+1').replace('<!-- Grid', `<!-- Etage -->\n  <rect x="30" y="560" width="80" height="22" rx="6" fill="#22C55E"/>\n  <text x="70" y="575" class="label" fill="white" font-size="10">R+1</text>\n  <!-- Grid`);
};

// T4 R+2
export const T4_R2 = (s: number, toit: string) => {
  const t4 = T4_RDC(s / 3, toit);
  return t4.replace('T4', 'T4 R+2').replace('<!-- Grid', `<!-- Etage -->\n  <rect x="30" y="560" width="80" height="22" rx="6" fill="#0B5FFF"/>\n  <text x="70" y="575" class="label" fill="white" font-size="10">R+2</text>\n  <!-- Grid`);
};

// T5 R+2
export const T5_R2 = (s: number, toit: string) => {
  const scale = Math.sqrt(s / 140);
  const bw = Math.round(400 * scale);
  const bh = Math.round(280 * scale);
  const rooms = [
    { name: "Salon", x: 110, y: 160, w: Math.round(bw * 0.35), h: Math.round(bh * 0.5) },
    { name: "Cuisine", x: 110 + Math.round(bw * 0.4), y: 160, w: Math.round(bw * 0.3), h: Math.round(bh * 0.5) },
    { name: "Salle à manger", x: 110 + Math.round(bw * 0.75), y: 160, w: Math.round(bw * 0.2), h: Math.round(bh * 0.5) },
    { name: "Ch. 1", x: 110, y: 160 + Math.round(bh * 0.55), w: Math.round(bw * 0.22), h: Math.round(bh * 0.4) },
    { name: "Ch. 2", x: 110 + Math.round(bw * 0.26), y: 160 + Math.round(bh * 0.55), w: Math.round(bw * 0.22), h: Math.round(bh * 0.4) },
    { name: "Ch. 3", x: 110 + Math.round(bw * 0.52), y: 160 + Math.round(bh * 0.55), w: Math.round(bw * 0.22), h: Math.round(bh * 0.4) },
    { name: "Ch. 4", x: 110 + Math.round(bw * 0.78), y: 160 + Math.round(bh * 0.55), w: Math.round(bw * 0.2), h: Math.round(bh * 0.3) },
  ];
  return `${HEADER_SVG.replace('{SURFACE}', String(s)).replace('{CHAMBRES}', 'T5').replace('{DATE}', new Date().toLocaleDateString('fr-FR')).replace('{TOITURE}', toit)}
  <rect x="30" y="560" width="80" height="22" rx="6" fill="#0B5FFF"/>
  <text x="70" y="575" class="label" fill="white" font-size="10">R+2</text>
  ${makeWalls(bw, bh, rooms)}
  ${makeWindows(100, 150, bw, bh, 4)}
  ${makeDoors(100 + bw / 2, 150 + bh, 'top')}
  ${FOOTER_SVG}`;
};

export const TEMPLATES: Record<string, (s: number, toit: string) => string> = {
  "studio_rdc": Studio_RDC,
  "t2_rdc": T2_RDC,
  "t3_rdc": T3_RDC,
  "t4_rdc": T4_RDC,
  "t3_r1": T3_R1,
  "t4_r1": T4_R1,
  "t4_r2": T4_R2,
  "t5_r2": T5_R2,
};