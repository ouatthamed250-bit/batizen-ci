"use client";

import { useEffect, useRef, useState } from "react";

interface Plan2DProps {
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

// Couleurs des pièces
const COLORS = {
  salon: "#F5E6D3",
  cuisine: "#F5F5D3",
  chambre: "#D3E4F5",
  salleDeBain: "#D3F5E6",
  garage: "#E6E6E6",
  piscine: "#4FC3F7",
  wall: "#0D2B6B",
  window: "#87CEEB",
};

export default function PlanGenerator2D({
  surface,
  largeur,
  longueur,
  chambres,
  sallesDeBain,
  etages,
  garage,
  piscine,
  style = "Moderne",
}: Plan2DProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [viewMode, setViewMode] = useState<"2d" | "3d">("2d");

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Effacer le canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Dimensions
    const padding = 40;
    const scale = Math.min(
      (canvas.width - padding * 2) / largeur,
      (canvas.height - padding * 2) / longueur,
      10
    );

    const houseWidth = largeur * scale;
    const houseLength = longueur * scale;
    const offsetX = (canvas.width - houseWidth) / 2;
    const offsetY = (canvas.height - houseLength) / 2;

    // Dessiner le contour principal
    ctx.fillStyle = "white";
    ctx.fillRect(offsetX, offsetY, houseWidth, houseLength);
    ctx.strokeStyle = "var(--navy)";
    ctx.lineWidth = 3;
    ctx.strokeRect(offsetX, offsetY, houseWidth, houseLength);

    // Calcul des surfaces
    const salonSurface = Math.floor(surface * 0.3);
    const cuisineSurface = Math.floor(surface * 0.15);
    const piecesRestantes = surface - salonSurface - cuisineSurface;
    const chambreSurface = Math.floor(piecesRestantes / chambres);

    // Dimensions des pièces
    const salonWidth = houseWidth * 0.4;
    const salonLength = houseLength * 0.5;
    const cuisineWidth = houseWidth * 0.35;
    const cuisineLength = houseLength * 0.45;
    const chambreWidth = (houseWidth * 0.85) / Math.max(1, chambres);
    const chambreLength = houseLength * 0.4;

    // Positionnement des pièces
    // Salon - en bas à gauche
    ctx.fillStyle = COLORS.salon;
    ctx.fillRect(offsetX + 10, offsetY + houseLength - salonLength - 10, salonWidth, salonLength);
    ctx.strokeStyle = "var(--navy)";
    ctx.lineWidth = 2;
    ctx.strokeRect(offsetX + 10, offsetY + houseLength - salonLength - 10, salonWidth, salonLength);
    ctx.fillStyle = "var(--navy)";
    ctx.font = "12px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("Salon", offsetX + salonWidth / 2 + 10, offsetY + houseLength - salonLength / 2 - 10);
    ctx.fillText(`${salonSurface}m²`, offsetX + salonWidth / 2 + 10, offsetY + houseLength - salonLength / 2 + 5);

    // Cuisine - en bas à droite
    ctx.fillStyle = COLORS.cuisine;
    ctx.fillRect(offsetX + houseWidth - cuisineWidth - 10, offsetY + houseLength - cuisineLength - 10, cuisineWidth, cuisineLength);
    ctx.strokeRect(offsetX + houseWidth - cuisineWidth - 10, offsetY + houseLength - cuisineLength - 10, cuisineWidth, cuisineLength);
    ctx.fillStyle = "var(--navy)";
    ctx.fillText("Cuisine", offsetX + houseWidth - cuisineWidth / 2 - 10, offsetY + houseLength - cuisineLength / 2 - 10);
    ctx.fillText(`${cuisineSurface}m²`, offsetX + houseWidth - cuisineWidth / 2 - 10, offsetY + houseLength - cuisineLength / 2 + 5);

    // Chambres - en haut
    for (let i = 0; i < chambres; i++) {
      const chambreX = offsetX + 10 + i * chambreWidth;
      ctx.fillStyle = COLORS.chambre;
      ctx.fillRect(chambreX, offsetY + 10, chambreWidth - 5, chambreLength);
      ctx.strokeRect(chambreX, offsetY + 10, chambreWidth - 5, chambreLength);
      ctx.fillStyle = "var(--navy)";
      ctx.fillText(`Chambre ${i + 1}`, chambreX + chambreWidth / 2 - 2.5, offsetY + chambreLength / 2 + 10);
      ctx.fillText(`${chambreSurface}m²`, chambreX + chambreWidth / 2 - 2.5, offsetY + chambreLength / 2 + 25);
    }

    // Salles de bain
    const sdbWidth = 8 * scale;
    const sdbLength = 8 * scale;
    for (let i = 0; i < sallesDeBain; i++) {
      const sdbX = offsetX + houseWidth / 2 - sdbWidth / 2;
      const sdbY = offsetY + houseLength * 0.5;
      ctx.fillStyle = COLORS.salleDeBain;
      ctx.fillRect(sdbX + i * (sdbWidth + 15), sdbY, sdbWidth, sdbLength);
      ctx.strokeRect(sdbX + i * (sdbWidth + 15), sdbY, sdbWidth, sdbLength);
      ctx.fillStyle = "var(--navy)";
      ctx.fillText(`SdB ${i + 1}`, sdbX + i * (sdbWidth + 15) + sdbWidth / 2, sdbY + sdbLength / 2 + 5);
    }

    // Fenêtres (lignes doubles sur les murs extérieurs)
    ctx.strokeStyle = COLORS.window;
    ctx.lineWidth = 1;
    for (let y = 20; y < houseLength; y += 30) {
      ctx.beginPath();
      ctx.moveTo(offsetX, offsetY + y);
      ctx.lineTo(offsetX, offsetY + y + 15);
      ctx.stroke();
    }
    for (let y = 20; y < houseLength; y += 30) {
      ctx.beginPath();
      ctx.moveTo(offsetX + houseWidth, offsetY + y);
      ctx.lineTo(offsetX + houseWidth, offsetY + y + 15);
      ctx.stroke();
    }

    // Portes (arcs de cercle)
    ctx.strokeStyle = "var(--navy)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(offsetX + salonWidth + 20, offsetY + houseLength - salonLength / 2, 10, Math.PI, 0, false);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(offsetX + salonWidth + 10, offsetY + houseLength - salonLength / 2);
    ctx.lineTo(offsetX + salonWidth + 10, offsetY + houseLength - salonLength / 2 - 20);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(offsetX + salonWidth + 30, offsetY + houseLength - salonLength / 2);
    ctx.lineTo(offsetX + salonWidth + 30, offsetY + houseLength - salonLength / 2 - 20);
    ctx.stroke();

    // Étiquettes étages si plusieurs étages
    if (etages > 1) {
      ctx.fillStyle = "var(--btp-gris-clair)";
      ctx.font = "10px sans-serif";
      for (let e = 1; e < etages; e++) {
        ctx.fillText(`Étage ${e + 1}`, offsetX + 10, offsetY + 10 + e * 80);
      }
    }

    // Garage
    if (garage) {
      const garageWidth = houseWidth * 0.4;
      const garageHeight = houseLength * 0.25;
      ctx.fillStyle = COLORS.garage;
      ctx.fillRect(offsetX - garageWidth - 10, offsetY + houseLength / 2 - garageHeight / 2, garageWidth, garageHeight);
      ctx.strokeRect(offsetX - garageWidth - 10, offsetY + houseLength / 2 - garageHeight / 2, garageWidth, garageHeight);
      ctx.fillStyle = "var(--navy)";
      ctx.fillText("Garage", offsetX - garageWidth / 2 - 10, offsetY + houseLength / 2 + 5);
    }

    // Piscine (rectangle avec coins arrondis)
    if (piscine) {
      const piscineWidth = 12 * scale;
      const piscineHeight = 6 * scale;
      const piscineX = offsetX + houseWidth + 20;
      const piscineY = offsetY + houseLength - piscineHeight - 20;
      ctx.fillStyle = COLORS.piscine;
      ctx.beginPath();
      ctx.moveTo(piscineX + 5, piscineY);
      ctx.lineTo(piscineX + piscineWidth - 5, piscineY);
      ctx.quadraticCurveTo(piscineX + piscineWidth, piscineY, piscineX + piscineWidth, piscineY + 5);
      ctx.lineTo(piscineX + piscineWidth, piscineY + piscineHeight - 5);
      ctx.quadraticCurveTo(piscineX + piscineWidth, piscineY + piscineHeight, piscineX + piscineWidth - 5, piscineY + piscineHeight);
      ctx.lineTo(piscineX + 5, piscineY + piscineHeight);
      ctx.quadraticCurveTo(piscineX, piscineY + piscineHeight, piscineX, piscineY + piscineHeight - 5);
      ctx.lineTo(piscineX, piscineY + 5);
      ctx.quadraticCurveTo(piscineX, piscineY, piscineX + 5, piscineY);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = "white";
      ctx.font = "11px sans-serif";
      ctx.fillText("Piscine", piscineX + piscineWidth / 2, piscineY + piscineHeight / 2);
    }

    // Échelle
    ctx.fillStyle = "var(--navy)";
    ctx.font = "10px sans-serif";
    ctx.fillText("─── 5m", offsetX + houseWidth / 2, offsetY + houseLength + 25);
  }, [surface, largeur, longueur, chambres, sallesDeBain, etages, garage, piscine, style]);

  const downloadPNG = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = "plan-batizen-2d.png";
    link.href = canvas.toDataURL();
    link.click();
  };

  return (
    <div className="space-y-4">
      <canvas
        ref={canvasRef}
        width={400}
        height={400}
        className="border-2 border-white/20 rounded-xl bg-white/10 w-full max-w-[400px]"
      />

      <div className="flex gap-2 justify-center">
        <button
          className={`px-4 py-2 rounded-xl font-semibold text-sm transition ${
            viewMode === "2d"
              ? "bg-gradient-to-b from-[#FF8C00] to-[#CC5500] text-white"
              : "bg-white/20 text-white"
          }`}
          onClick={() => setViewMode("2d")}
        >
          📐 Vue 2D
        </button>
        <button
          className={`px-4 py-2 rounded-xl font-semibold text-sm transition ${
            viewMode === "3d"
              ? "bg-gradient-to-b from-[#FF8C00] to-[#CC5500] text-white"
              : "bg-white/20 text-white"
          }`}
          onClick={() => setViewMode("3d")}
        >
          🏠 Vue 3D
        </button>
        <button
          onClick={downloadPNG}
          className="flex items-center gap-2 px-4 py-2 rounded-xl border border-white/20 bg-white/10 font-semibold text-white transition hover:bg-white/20"
        >
          📥 Télécharger PNG
        </button>
      </div>

      <div className="flex flex-wrap gap-3 justify-center text-xs">
        <div className="flex items-center gap-1"><div className="w-4 h-4 bg-[#F5E6D3] rounded"></div> Salon ({Math.floor(surface * 0.3)}m²)</div>
        <div className="flex items-center gap-1"><div className="w-4 h-4 bg-[#D3E4F5] rounded"></div> Chambres ({Math.floor((surface - Math.floor(surface*0.3) - Math.floor(surface*0.15))/chambres)}m²)</div>
        <div className="flex items-center gap-1"><div className="w-4 h-4 bg-[#F5F5D3] rounded"></div> Cuisine ({Math.floor(surface * 0.15)}m²)</div>
        {sallesDeBain > 0 && (
          <div className="flex items-center gap-1"><div className="w-4 h-4 bg-[#D3F5E6] rounded"></div> SdB ({sallesDeBain}x)</div>
        )}
        {garage && <div className="flex items-center gap-1"><div className="w-4 h-4 bg-[#E6E6E6] rounded"></div> Garage</div>}
        {piscine && <div className="flex items-center gap-1"><div className="w-4 h-4 bg-[#4FC3F7] rounded"></div> Piscine</div>}
      </div>

      <p className="text-center text-sm text-white/60">
        Surface totale: {surface}m² | {chambres + sallesDeBain + 2 + (garage ? 1 : 0) + (piscine ? 1 : 0)} pièces
      </p>
    </div>
  );
}