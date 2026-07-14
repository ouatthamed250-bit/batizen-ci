"use client";

import { useState, useRef, useCallback, useMemo, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Text, Html } from "@react-three/drei";
import { motion, AnimatePresence } from "framer-motion";
import * as THREE from "three";

// ─── Types ────────────────────────────────────────────────────────────────────

interface PlanConfig {
  longueur: number;
  largeur: number;
  chambres: number;
  sdb: number;
  cuisineOuverte: boolean;
  etages: number;
  orientation: "N" | "S" | "E" | "O";
  style: "moderne" | "traditionnel" | "colonial";
}

interface PieceData {
  nom: string;
  x: number;
  y: number;
  w: number;
  h: number;
  couleur: string;
}

const PIECE_COLORS: Record<string, string> = {
  Salon: "#FFF3E0",
  Cuisine: "#E8F5E9",
  "Salle à manger": "#F3E5F5",
  "Chambre 1": "#E3F2FD",
  "Chambre 2": "#FCE4EC",
  "Chambre 3": "#E0F7FA",
  "Chambre 4": "#FFF8E1",
  "Salle de bain": "#E1BEE7",
  "Salle de bain 2": "#B2DFDB",
  WC: "#D7CCC8",
  Couloir: "#ECEFF1",
  Buanderie: "#EFEBE9",
  Bureau: "#C5CAE9",
};

const MUR_EPAISSEUR = 0.2;
const PORTE_LARGEUR = 0.9;
const FENETRE_LARGEUR = 1.2;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function genererPieces(config: PlanConfig): PieceData[] {
  const pieces: PieceData[] = [];
  const { longueur, largeur, chambres, sdb, cuisineOuverte } = config;
  const l = longueur;
  const L = largeur;

  // Salon (centre gauche)
  pieces.push({ nom: "Salon", x: 0, y: 0, w: l * 0.45, h: L * 0.55, couleur: PIECE_COLORS["Salon"] });

  // Cuisine
  if (cuisineOuverte) {
    // Cuisine ouverte sur le salon
    pieces.push({ nom: "Cuisine", x: l * 0.45, y: 0, w: l * 0.25, h: L * 0.55, couleur: PIECE_COLORS["Cuisine"] });
  } else {
    pieces.push({ nom: "Cuisine", x: l * 0.45, y: 0, w: l * 0.2, h: L * 0.45, couleur: PIECE_COLORS["Cuisine"] });
  }

  // Salle à manger (si cuisine fermée)
  if (!cuisineOuverte) {
    pieces.push({ nom: "Salle à manger", x: l * 0.65, y: 0, w: l * 0.2, h: L * 0.45, couleur: PIECE_COLORS["Salle à manger"] });
  }

  // Couloir central
  const couloirH = 0.8;
  const couloirY = L * 0.55;

  // Chambres (en haut)
  const chambresParRangee = Math.min(chambres, 2);
  const chambresLigne2 = chambres > 2 ? chambres - 2 : 0;
  const chWidth = (l - (chambresParRangee + 1) * 0.3) / chambresParRangee;

  for (let i = 0; i < chambresParRangee; i++) {
    pieces.push({
      nom: `Chambre ${i + 1}`,
      x: i * (chWidth + 0.3) + 0.3,
      y: couloirY + couloirH,
      w: chWidth,
      h: L * 0.45 - couloirH,
      couleur: PIECE_COLORS[`Chambre ${i + 1}`],
    });
  }

  if (chambresLigne2 > 0) {
    const chWidth2 = (l - (chambresLigne2 + 1) * 0.3) / chambresLigne2;
    for (let i = 0; i < chambresLigne2; i++) {
      pieces.push({
        nom: `Chambre ${chambresParRangee + i + 1}`,
        x: i * (chWidth2 + 0.3) + 0.3,
        y: couloirY + couloirH + L * 0.25,
        w: chWidth2,
        h: L * 0.2,
        couleur: PIECE_COLORS[`Chambre ${chambresParRangee + i + 1}`],
      });
    }
  }

  // Salle de bain / WC
  pieces.push({ nom: "Salle de bain", x: l - 2.5, y: couloirY + couloirH, w: 2.2, h: 2, couleur: PIECE_COLORS["Salle de bain"] });
  
  if (sdb >= 2) {
    pieces.push({ nom: "Salle de bain 2", x: l - 2.5, y: couloirY + couloirH + 2.5, w: 2.2, h: 2, couleur: PIECE_COLORS["Salle de bain 2"] });
  }

  pieces.push({ nom: "WC", x: l - 2.5, y: 0, w: 1.5, h: 1.5, couleur: PIECE_COLORS["WC"] });

  return pieces;
}

function getCouleurStyle(style: string): { mur: string; toit: string; sol: string } {
  switch (style) {
    case "moderne": return { mur: "#E0E0E0", toit: "#424242", sol: "#BDBDBD" };
    case "traditionnel": return { mur: "#D2691E", toit: "#8B4513", sol: "#7CFC00" };
    case "colonial": return { mur: "#FFF8DC", toit: "#A0522D", sol: "#90EE90" };
    default: return { mur: "#D2691E", toit: "#8B4513", sol: "#7CFC00" };
  }
}

// ─── Composant Plan 2D ────────────────────────────────────────────────────────

function Plan2DRender({ pieces, longueur, largeur }: { pieces: PieceData[]; longueur: number; largeur: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const scale = Math.min(600 / Math.max(longueur, largeur), 80);
  const offsetX = 40;
  const offsetY = 40;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const w = Math.max(longueur * scale + 80, 400);
    const h = Math.max(largeur * scale + 80, 500);
    canvas.width = w;
    canvas.height = h;

    // Fond blanc
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, w, h);

    // Grille
    ctx.strokeStyle = "#E0E0E0";
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= longueur + 1; i++) {
      ctx.beginPath();
      ctx.moveTo(offsetX + i * scale, offsetY);
      ctx.lineTo(offsetX + i * scale, offsetY + largeur * scale);
      ctx.stroke();
    }
    for (let i = 0; i <= largeur + 1; i++) {
      ctx.beginPath();
      ctx.moveTo(offsetX, offsetY + i * scale);
      ctx.lineTo(offsetX + longueur * scale, offsetY + i * scale);
      ctx.stroke();
    }

    // Pièces
    pieces.forEach((piece) => {
      const x = offsetX + piece.x * scale;
      const y = offsetY + piece.y * scale;
      const pw = piece.w * scale;
      const ph = piece.h * scale;

      // Fond de la pièce
      ctx.fillStyle = piece.couleur;
      ctx.fillRect(x, y, pw, ph);

      // Bordure (mur)
      ctx.strokeStyle = "#333333";
      ctx.lineWidth = 3;
      ctx.strokeRect(x, y, pw, ph);

      // Nom de la pièce
      ctx.fillStyle = "#1a1a1a";
      ctx.font = "bold 11px Arial";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(piece.nom, x + pw / 2, y + ph / 2 - 7);
      ctx.font = "9px Arial";
      ctx.fillStyle = "#666666";
      ctx.fillText(`${piece.w.toFixed(1)} × ${piece.h.toFixed(1)} m`, x + pw / 2, y + ph / 2 + 10);

      // Porte (triangle sur le bord)
      ctx.fillStyle = "#8B4513";
      ctx.beginPath();
      ctx.moveTo(x + pw / 2, y);
      ctx.lineTo(x + pw / 2 + 8, y - 8);
      ctx.lineTo(x + pw / 2 - 8, y - 8);
      ctx.closePath();
      ctx.fill();
    });

    // Échelle graphique
    const echelleX = offsetX;
    const echelleY = offsetY + largeur * scale + 25;
    const echelleLongueur = scale * 2;
    ctx.strokeStyle = "#333";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(echelleX, echelleY);
    ctx.lineTo(echelleX + echelleLongueur, echelleY);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(echelleX, echelleY - 5);
    ctx.lineTo(echelleX, echelleY + 5);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(echelleX + echelleLongueur, echelleY - 5);
    ctx.lineTo(echelleX + echelleLongueur, echelleY + 5);
    ctx.stroke();
    ctx.fillStyle = "#333";
    ctx.font = "9px Arial";
    ctx.textAlign = "center";
    ctx.fillText("2 m", echelleX + echelleLongueur / 2, echelleY + 15);

    // Dimensions globales
    ctx.fillStyle = "#FF6B00";
    ctx.font = "bold 12px Arial";
    ctx.textAlign = "center";
    ctx.fillText(`${longueur} m`, offsetX + (longueur * scale) / 2, offsetY - 10);
    ctx.save();
    ctx.translate(offsetX - 15, offsetY + (largeur * scale) / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText(`${largeur} m`, 0, 0);
    ctx.restore();
  }, [pieces, longueur, largeur, scale]);

  return <canvas ref={canvasRef} className="w-full rounded-xl border-2 border-[#FF6B00]/20" style={{ maxHeight: "500px" }} />;
}

// ─── Composant Maison 3D ─────────────────────────────────────────────────────

function Mur3D({ position, args, color }: { position: [number, number, number]; args: [number, number, number]; color: string }) {
  return (
    <mesh position={position} castShadow receiveShadow>
      <boxGeometry args={args} />
      <meshStandardMaterial color={color} roughness={0.8} />
    </mesh>
  );
}

function Toit3D({ position, args, color }: { position: [number, number, number]; args: [number, number, number]; color: string }) {
  return (
    <mesh position={position} castShadow rotation={[0, 0, 0]}>
      <coneGeometry args={args} />
      <meshStandardMaterial color={color} roughness={0.9} />
    </mesh>
  );
}

function Porte3D({ position }: { position: [number, number, number] }) {
  return (
    <mesh position={position} castShadow>
      <boxGeometry args={[0.9, 2.1, 0.1]} />
      <meshStandardMaterial color="#654321" roughness={0.6} />
    </mesh>
  );
}

function Fenetre3D({ position }: { position: [number, number, number] }) {
  return (
    <mesh position={position} castShadow>
      <boxGeometry args={[1.0, 1.2, 0.05]} />
      <meshStandardMaterial color="#87CEEB" transparent opacity={0.4} roughness={0.1} metalness={0.3} />
    </mesh>
  );
}

function Maison3DScene({ config, pieces }: { config: PlanConfig; pieces: PieceData[] }) {
  const couleurs = getCouleurStyle(config.style);
  const { longueur: l, largeur: L, etages } = config;

  const hauteurMur = 3;
  const hauteurTotale = hauteurMur * etages;

  return (
    <>
      {/* Éclairage */}
      <ambientLight intensity={0.6} />
      <directionalLight
        position={[15, 25, 10]}
        intensity={1.2}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-far={50}
        shadow-camera-left={-20}
        shadow-camera-right={20}
        shadow-camera-top={20}
        shadow-camera-bottom={-20}
      />
      <hemisphereLight args={["#87CEEB", "#3a7d44", 0.4]} />

      {/* Contrôles */}
      <OrbitControls
        enableDamping
        dampingFactor={0.1}
        minDistance={5}
        maxDistance={30}
        maxPolarAngle={Math.PI / 2.1}
      />

      {/* Sol */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[l / 2, -0.05, L / 2]} receiveShadow>
        <planeGeometry args={[Math.max(l + 10, 20), Math.max(L + 10, 20)]} />
        <meshStandardMaterial color={couleurs.sol} roughness={1} />
      </mesh>

      {/* Murs extérieurs */}
      {Array.from({ length: etages }).map((_, etage) => (
        <group key={etage} position={[0, etage * hauteurMur, 0]}>
          {/* Mur avant */}
          <Mur3D position={[l / 2, hauteurMur / 2, 0]} args={[l, hauteurMur, 0.2]} color={couleurs.mur} />
          {/* Mur arrière */}
          <Mur3D position={[l / 2, hauteurMur / 2, L]} args={[l, hauteurMur, 0.2]} color={couleurs.mur} />
          {/* Mur gauche */}
          <Mur3D position={[0, hauteurMur / 2, L / 2]} args={[0.2, hauteurMur, L]} color={couleurs.mur} />
          {/* Mur droit */}
          <Mur3D position={[l, hauteurMur / 2, L / 2]} args={[0.2, hauteurMur, L]} color={couleurs.mur} />

          {/* Plancher */}
          <mesh position={[l / 2, 0, L / 2]} receiveShadow>
            <planeGeometry args={[l - 0.2, L - 0.2]} />
            <meshStandardMaterial color="#8B7355" roughness={0.9} />
          </mesh>

          {/* Porte d'entrée */}
          {etage === 0 && <Porte3D position={[l / 2, 1.05, 0.15]} />}

          {/* Fenêtres façade avant */}
          {[l * 0.2, l * 0.5, l * 0.8].map((x, i) => (
            <Fenetre3D key={i} position={[x, 1.6, 0.15]} />
          ))}

          {/* Fenêtres façade arrière */}
          {[l * 0.3, l * 0.7].map((x, i) => (
            <Fenetre3D key={`arriere-${i}`} position={[x, 1.6, L - 0.1]} />
          ))}
        </group>
      ))}

      {/* Toit */}
      {etages > 0 && (
        <group position={[l / 2, etages * hauteurMur, L / 2]}>
          <Toit3D position={[0, 0.5, 0]} args={[Math.max(l, L) * 0.6, 2, 4]} color={couleurs.toit} />
          {/* Toit plat supplémentaire si moderne */}
          {config.style === "moderne" && (
            <mesh position={[0, -0.5, 0]} receiveShadow>
              <boxGeometry args={[l + 0.5, 0.15, L + 0.5]} />
              <meshStandardMaterial color="#555" roughness={0.5} />
            </mesh>
          )}
        </group>
      )}
    </>
  );
}

// ─── Composant principal PlanGenerator ─────────────────────────────────────────

export default function PlanGenerator() {
  const [config, setConfig] = useState<PlanConfig>({
    longueur: 12,
    largeur: 8,
    chambres: 2,
    sdb: 1,
    cuisineOuverte: true,
    etages: 1,
    orientation: "N",
    style: "moderne",
  });

  const [vue, setVue] = useState<"form" | "2d" | "3d">("form");
  const [planGenere, setPlanGenere] = useState(false);
  const plan2dRef = useRef<HTMLDivElement>(null);

  const pieces = useMemo(() => genererPieces(config), [config]);

  const genererPlan = useCallback(() => {
    setPlanGenere(true);
    setVue("2d");
  }, []);

  const handleChange = useCallback((field: keyof PlanConfig, value: number | boolean | string) => {
    setConfig((prev) => ({ ...prev, [field]: value }));
  }, []);

  const telechargerPNG = useCallback(async () => {
    if (!plan2dRef.current) return;
    try {
      const { default: html2canvas } = await import("html2canvas");
      const canvas = await html2canvas(plan2dRef.current, { backgroundColor: "#FFFFFF", scale: 2 });
      const link = document.createElement("a");
      link.download = `plan-batizen-${Date.now()}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch {
      // fallback
    }
  }, []);

  const telechargerPDF = useCallback(async () => {
    if (!plan2dRef.current) return;
    try {
      const { default: html2canvas } = await import("html2canvas");
      const { default: jsPDF } = await import("jspdf");
      const canvas = await html2canvas(plan2dRef.current, { backgroundColor: "#FFFFFF", scale: 2 });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("l", "mm", "a4");
      const pdfW = pdf.internal.pageSize.getWidth();
      const pdfH = (canvas.height * pdfW) / canvas.width;
      pdf.addImage(imgData, "PNG", 0, 0, pdfW, pdfH);
      pdf.save(`plan-batizen-${Date.now()}.pdf`);
    } catch {
      // fallback
    }
  }, []);

  // ─── Render formulaire ─────────────────────────────────────────────────────

  if (!planGenere) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-[25px] bg-white p-6 shadow-[0_10px_40px_rgba(0,0,0,0.1)]"
      >
        <h3 className="mb-6 flex items-center gap-3 text-2xl font-black text-[#1a1a1a]">
          🏗️ Générateur de plans interactifs
        </h3>
        <p className="mb-6 text-sm text-[#6B7280]">
          Configurez votre projet et générez un plan 2D/3D interactif en temps réel.
        </p>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          {/* Longueur */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-[0.12em] text-[#6B7280]">
              Longueur (m) *
            </label>
            <input
              type="number"
              min={5}
              max={50}
              value={config.longueur}
              onChange={(e) => handleChange("longueur", parseFloat(e.target.value) || 8)}
              className="w-full rounded-[12px] border-2 border-[#E7EBF5] bg-[#F7F9FC] px-4 py-3 text-sm font-bold text-[#1a1a1a] outline-none transition-all focus:border-[#FF6B00] focus:bg-white"
            />
          </div>

          {/* Largeur */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-[0.12em] text-[#6B7280]">
              Largeur (m) *
            </label>
            <input
              type="number"
              min={4}
              max={30}
              value={config.largeur}
              onChange={(e) => handleChange("largeur", parseFloat(e.target.value) || 6)}
              className="w-full rounded-[12px] border-2 border-[#E7EBF5] bg-[#F7F9FC] px-4 py-3 text-sm font-bold text-[#1a1a1a] outline-none transition-all focus:border-[#FF6B00] focus:bg-white"
            />
          </div>

          {/* Chambres */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-[0.12em] text-[#6B7280]">
              Chambres
            </label>
            <select
              value={config.chambres}
              onChange={(e) => handleChange("chambres", parseInt(e.target.value))}
              className="w-full rounded-[12px] border-2 border-[#E7EBF5] bg-[#F7F9FC] px-4 py-3 text-sm font-bold text-[#1a1a1a] outline-none transition-all focus:border-[#FF6B00] focus:bg-white"
            >
              {[1, 2, 3, 4].map((n) => (
                <option key={n} value={n}>
                  {n} chambre{n > 1 ? "s" : ""}
                </option>
              ))}
            </select>
          </div>

          {/* Salles de bain */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-[0.12em] text-[#6B7280]">
              Salles de bain
            </label>
            <select
              value={config.sdb}
              onChange={(e) => handleChange("sdb", parseInt(e.target.value))}
              className="w-full rounded-[12px] border-2 border-[#E7EBF5] bg-[#F7F9FC] px-4 py-3 text-sm font-bold text-[#1a1a1a] outline-none transition-all focus:border-[#FF6B00] focus:bg-white"
            >
              {[1, 2].map((n) => (
                <option key={n} value={n}>
                  {n} salle{n > 1 ? "s" : ""} de bain
                </option>
              ))}
            </select>
          </div>

          {/* Cuisine ouverte */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-[0.12em] text-[#6B7280]">
              Type de cuisine
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => handleChange("cuisineOuverte", true)}
                className={`flex-1 rounded-[12px] px-4 py-3 text-sm font-bold transition-all ${
                  config.cuisineOuverte
                    ? "bg-gradient-to-r from-[#FF6B00] to-[#FF8C00] text-white shadow-md"
                    : "bg-[#F7F9FC] text-[#6B7280] hover:bg-[#E7EBF5]"
                }`}
              >
                🍳 Ouverte
              </button>
              <button
                type="button"
                onClick={() => handleChange("cuisineOuverte", false)}
                className={`flex-1 rounded-[12px] px-4 py-3 text-sm font-bold transition-all ${
                  !config.cuisineOuverte
                    ? "bg-gradient-to-r from-[#FF6B00] to-[#FF8C00] text-white shadow-md"
                    : "bg-[#F7F9FC] text-[#6B7280] hover:bg-[#E7EBF5]"
                }`}
              >
                🚪 Fermée
              </button>
            </div>
          </div>

          {/* Étages */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-[0.12em] text-[#6B7280]">
              Nombre d'étages
            </label>
            <select
              value={config.etages}
              onChange={(e) => handleChange("etages", parseInt(e.target.value))}
              className="w-full rounded-[12px] border-2 border-[#E7EBF5] bg-[#F7F9FC] px-4 py-3 text-sm font-bold text-[#1a1a1a] outline-none transition-all focus:border-[#FF6B00] focus:bg-white"
            >
              {[1, 2, 3].map((n) => (
                <option key={n} value={n}>
                  {n} étage{n > 1 ? "s" : ""}
                </option>
              ))}
            </select>
          </div>

          {/* Style */}
          <div className="space-y-1.5 md:col-span-2">
            <label className="block text-xs font-bold uppercase tracking-[0.12em] text-[#6B7280]">
              Style architectural
            </label>
            <div className="flex gap-2">
              {(["moderne", "traditionnel", "colonial"] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => handleChange("style", s)}
                  className={`flex-1 rounded-[12px] px-4 py-3 text-sm font-bold transition-all ${
                    config.style === s
                      ? "bg-gradient-to-r from-[#FF6B00] to-[#FF8C00] text-white shadow-md"
                      : "bg-[#F7F9FC] text-[#6B7280] hover:bg-[#E7EBF5]"
                  }`}
                >
                  {s === "moderne" ? "🏢 Moderne" : s === "traditionnel" ? "🏡 Traditionnel" : "🏛️ Colonial"}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Bouton générer */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={genererPlan}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-[14px] bg-gradient-to-r from-[#FF6B00] to-[#FF8C00] px-6 py-4 text-lg font-bold text-white shadow-[0_8px_25px_rgba(255,107,0,0.35)] transition-all duration-300 hover:shadow-[0_12px_35px_rgba(255,107,0,0.5)]"
        >
          🚀 Générer le plan interactif
        </motion.button>
      </motion.div>
    );
  }

  // ─── Render plans 2D / 3D ──────────────────────────────────────────────────

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Boutons de contrôle */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex rounded-[12px] bg-[#F7F9FC] p-1">
          <button
            type="button"
            onClick={() => setVue("2d")}
            className={`rounded-[10px] px-4 py-2 text-sm font-bold transition-all ${
              vue === "2d" ? "bg-white text-[#FF6B00] shadow-sm" : "text-[#6B7280] hover:text-[#FF6B00]"
            }`}
          >
            📐 Plan 2D
          </button>
          <button
            type="button"
            onClick={() => setVue("3d")}
            className={`rounded-[10px] px-4 py-2 text-sm font-bold transition-all ${
              vue === "3d" ? "bg-white text-[#FF6B00] shadow-sm" : "text-[#6B7280] hover:text-[#FF6B00]"
            }`}
          >
            🏠 Vue 3D
          </button>
        </div>

        <div className="flex gap-2">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={telechargerPNG}
            className="rounded-[12px] bg-[#F7F9FC] px-4 py-2 text-sm font-bold text-[#6B7280] transition-all hover:bg-[#FF6B00] hover:text-white"
          >
            📥 PNG
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={telechargerPDF}
            className="rounded-[12px] bg-[#F7F9FC] px-4 py-2 text-sm font-bold text-[#6B7280] transition-all hover:bg-[#FF6B00] hover:text-white"
          >
            📄 PDF
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setPlanGenere(false)}
            className="rounded-[12px] bg-[#F7F9FC] px-4 py-2 text-sm font-bold text-[#6B7280] transition-all hover:bg-[#FF6B00] hover:text-white"
          >
            ✏️ Modifier
          </motion.button>
        </div>
      </div>

      {/* Récapitulatif */}
      <div className="flex flex-wrap gap-2 text-xs">
        <span className="rounded-full bg-[#FFF7ED] px-3 py-1 font-bold text-[#FF6B00]">
          📏 {config.longueur} × {config.largeur} m
        </span>
        <span className="rounded-full bg-[#FFF7ED] px-3 py-1 font-bold text-[#FF6B00]">
          🛏️ {config.chambres} ch.
        </span>
        <span className="rounded-full bg-[#FFF7ED] px-3 py-1 font-bold text-[#FF6B00]">
          🚿 {config.sdb} sdb
        </span>
        <span className="rounded-full bg-[#FFF7ED] px-3 py-1 font-bold text-[#FF6B00]">
          🏗️ {config.etages} étage{config.etages > 1 ? "s" : ""}
        </span>
        <span className="rounded-full bg-[#FFF7ED] px-3 py-1 font-bold text-[#FF6B00]">
          🏛️ {config.style}
        </span>
      </div>

      {/* Plan 2D */}
      {vue === "2d" && (
        <motion.div
          key="plan2d"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          ref={plan2dRef}
          className="overflow-hidden rounded-[20px] bg-white p-4 shadow-[0_10px_40px_rgba(0,0,0,0.1)]"
        >
          <Plan2DRender pieces={pieces} longueur={config.longueur} largeur={config.largeur} />
          <p className="mt-2 text-center text-[10px] text-[#6B7280]">
            Plan généré automatiquement · Les dimensions sont approximatives
          </p>
        </motion.div>
      )}

      {/* Vue 3D */}
      {vue === "3d" && (
        <motion.div
          key="plan3d"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="overflow-hidden rounded-[20px] bg-white shadow-[0_10px_40px_rgba(0,0,0,0.1)]"
          style={{ height: "500px" }}
        >
          <Canvas shadows camera={{ position: [15, 10, 15], fov: 50 }}>
            <Maison3DScene config={config} pieces={pieces} />
          </Canvas>
          <div className="flex items-center justify-between bg-[#1a1a1a] px-4 py-2 text-[10px] text-white/60">
            <span>🖱️ Glisser pour tourner · Molette pour zoomer</span>
            <span>{config.longueur} × {config.largeur} m · {config.etages} étage{config.etages > 1 ? "s" : ""}</span>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}