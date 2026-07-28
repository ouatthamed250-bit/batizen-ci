"use client";

import { useEffect, useRef, useState, useMemo } from "react";

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

function Loader2D() {
  return (
    <div className="w-full h-[400px] flex flex-col items-center justify-center bg-gradient-to-br from-white/90 to-white/70 backdrop-blur-lg rounded-2xl border border-white/30 shadow-lg">
      <div className="relative mb-6">
        <div className="w-20 h-20 border-4 border-[#FF6B00]/20 border-t-[#FF6B00] rounded-full animate-spin"></div>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-3xl">📐</span>
        </div>
      </div>
      <h3 className="text-lg font-bold text-[var(--navy)] mb-2 text-center px-4">
        Votre plan gratuit est en préparation
      </h3>
      <p className="text-sm text-gray-600 text-center px-6 mb-4">
        Génération du plan...
      </p>
      <div className="w-48 h-2 bg-gray-200 rounded-full mt-6 overflow-hidden">
        <div className="h-full bg-gradient-to-r from-[#FF6B00] to-[#FF8C00] rounded-full animate-pulse" style={{width: '60%'}}></div>
      </div>
    </div>
  );
}

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
  const [isLoading, setIsLoading] = useState(true);

  // Calculs exposés pour le JSX (légende et stats)
  const nbChambres = Math.min(Math.max(1, chambres), 8);
  const nbSdb = Math.min(Math.max(1, sallesDeBain), 4);
  const totalRooms = 3 + nbChambres + nbSdb;

  useEffect(() => {
    const startTime = Date.now();
    requestAnimationFrame(() => {
      const elapsed = Date.now() - startTime;
      const delay = Math.max(500 - elapsed, 0);
      setTimeout(() => setIsLoading(false), delay);
    });
  }, []);

  useEffect(() => {
    if (isLoading) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

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

    ctx.fillStyle = "white";
    ctx.fillRect(offsetX, offsetY, houseWidth, houseLength);
    ctx.strokeStyle = "var(--navy)";
    ctx.lineWidth = 3;
    ctx.strokeRect(offsetX, offsetY, houseWidth, houseLength);

    // Surface moyenne par pièce (en m²)
    const avgRoomAreaM2 = Math.max(8, surface / totalRooms);
    
    // Conversion en pixels via le scale
    const avgRoomPx = avgRoomAreaM2 * scale;
    
    const chambreDim = Math.max(40, Math.min(houseWidth * 0.3, avgRoomPx * 0.8));
    const salonDim = Math.min(houseWidth * 0.45, chambreDim * 1.5);
    const salonDepth = Math.min(houseLength * 0.5, chambreDim * 1.4);
    const cuisineDim = Math.min(houseWidth * 0.35, chambreDim * 0.9);
    const cuisineDepth = Math.min(houseLength * 0.4, chambreDim * 0.8);
    const sdbDim = Math.max(30, Math.min(houseWidth * 0.15, chambreDim * 0.55));
    
    // Surface labels
    const salonArea = Math.round(salonDim * salonDepth / (scale * scale));
    const cuisineArea = Math.round(cuisineDim * cuisineDepth / (scale * scale));
    const chambreArea = Math.round(chambreDim * chambreDim / (scale * scale));

    // Zone jour (bas) : Salon + Cuisine
    const zoneJourY = offsetY + houseLength - salonDepth - 10;
    const espace = 8;
    
    // Salon à gauche
    ctx.fillStyle = COLORS.salon;
    ctx.fillRect(offsetX + 10, zoneJourY, salonDim, salonDepth);
    ctx.strokeStyle = "var(--navy)";
    ctx.lineWidth = 2;
    ctx.strokeRect(offsetX + 10, zoneJourY, salonDim, salonDepth);
    ctx.fillStyle = "var(--navy)";
    ctx.font = "11px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("Salon", offsetX + salonDim / 2 + 10, zoneJourY + salonDepth / 2 - 6);
    ctx.font = "9px sans-serif";
    ctx.fillText(`${salonArea}m²`, offsetX + salonDim / 2 + 10, zoneJourY + salonDepth / 2 + 8);
    
    // Cuisine à droite
    const cuisineX = offsetX + houseWidth - cuisineDim - 10;
    ctx.fillStyle = COLORS.cuisine;
    ctx.fillRect(cuisineX, zoneJourY + salonDepth - cuisineDepth, cuisineDim, cuisineDepth);
    ctx.strokeRect(cuisineX, zoneJourY + salonDepth - cuisineDepth, cuisineDim, cuisineDepth);
    ctx.fillStyle = "var(--navy)";
    ctx.font = "11px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("Cuisine", cuisineX + cuisineDim / 2, zoneJourY + salonDepth - cuisineDepth / 2 - 6);
    ctx.font = "9px sans-serif";
    ctx.fillText(`${cuisineArea}m²`, cuisineX + cuisineDim / 2, zoneJourY + salonDepth - cuisineDepth / 2 + 8);

    // Zone nuits (haut) : Chambres + SdB
    const zoneNuitY = offsetY + 10;
    const zoneNuitH = houseLength - salonDepth - 20 - espace;
    
    const chambreW = Math.min(chambreDim, (houseWidth - 20 - (nbChambres - 1) * espace) / Math.max(1, nbChambres));
    const chambreH = Math.min(chambreDim, zoneNuitH * 0.65);
    const sdbH = Math.min(sdbDim, zoneNuitH - chambreH - espace);
    
    for (let i = 0; i < nbChambres; i++) {
      const cx = offsetX + 10 + i * (chambreW + espace);
      ctx.fillStyle = COLORS.chambre;
      ctx.fillRect(cx, zoneNuitY, chambreW, chambreH);
      ctx.strokeRect(cx, zoneNuitY, chambreW, chambreH);
      ctx.fillStyle = "var(--navy)";
      ctx.font = "9px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(`Ch ${i + 1}`, cx + chambreW / 2, zoneNuitY + chambreH / 2 - 4);
      ctx.font = "8px sans-serif";
      ctx.fillText(`${chambreArea}m²`, cx + chambreW / 2, zoneNuitY + chambreH / 2 + 8);
    }
    
    const sdbW = Math.min(sdbDim, (houseWidth - 20 - (nbSdb - 1) * espace) / Math.max(1, nbSdb));
    for (let i = 0; i < nbSdb; i++) {
      const sx = offsetX + 10 + i * (sdbW + espace);
      const sy = zoneNuitY + chambreH + espace;
      ctx.fillStyle = COLORS.salleDeBain;
      ctx.fillRect(sx, sy, sdbW, sdbH);
      ctx.strokeRect(sx, sy, sdbW, sdbH);
      ctx.fillStyle = "var(--navy)";
      ctx.font = "8px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(`SdB ${i + 1}`, sx + sdbW / 2, sy + sdbH / 2 + 3);
    }

    // Garage
    if (garage) {
      const gW = Math.min(houseWidth * 0.35, chambreDim * 1.3);
      const gH = Math.min(salonDepth * 0.5, chambreDim);
      const gX = offsetX + 10;
      const gY = zoneJourY - gH - espace;
      ctx.fillStyle = COLORS.garage;
      ctx.fillRect(gX, gY, gW, gH);
      ctx.strokeRect(gX, gY, gW, gH);
      ctx.fillStyle = "var(--navy)";
      ctx.font = "9px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("Garage", gX + gW / 2, gY + gH / 2 + 3);
    }
    
    // Piscine
    if (piscine) {
      const pW = Math.min(houseWidth * 0.2, chambreDim * 0.8);
      const pH = Math.min(houseLength * 0.15, chambreDim * 0.4);
      const pX = offsetX + houseWidth + 15;
      const pY = zoneJourY + 10;
      ctx.fillStyle = COLORS.piscine;
      ctx.beginPath();
      ctx.roundRect(pX, pY, pW, pH, 5);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = "white";
      ctx.font = "8px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("Piscine", pX + pW / 2, pY + pH / 2 + 3);
    }

    // Fenêtres
    ctx.strokeStyle = COLORS.window;
    ctx.lineWidth = 1;
    for (let y = 20; y < houseLength; y += 30) {
      ctx.beginPath();
      ctx.moveTo(offsetX, offsetY + y);
      ctx.lineTo(offsetX, offsetY + y + 15);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(offsetX + houseWidth, offsetY + y);
      ctx.lineTo(offsetX + houseWidth, offsetY + y + 15);
      ctx.stroke();
    }

    // Échelle
    ctx.fillStyle = "var(--navy)";
    ctx.font = "10px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("─── 5m", offsetX + houseWidth / 2, offsetY + houseLength + 25);
  }, [surface, largeur, longueur, nbChambres, nbSdb, totalRooms, etages, garage, piscine, style, isLoading]);

  const downloadPNG = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = "plan-batizen-2d.png";
    link.href = canvas.toDataURL();
    link.click();
  };

  return (
    <div className="w-full">
      {isLoading ? (
        <Loader2D />
      ) : (
        <>
          <canvas
            ref={canvasRef}
            width={400}
            height={400}
            className="border-2 border-white/20 rounded-xl bg-white/10 w-full max-w-[400px]"
          />

          <div className="flex gap-2 justify-center">
            <button
              onClick={downloadPNG}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border border-white/20 bg-white/10 font-semibold text-white transition hover:bg-white/20"
            >
              📥 Télécharger PNG
            </button>
          </div>

          <div className="flex flex-wrap gap-3 justify-center text-xs">
            <div className="flex items-center gap-1"><div className="w-4 h-4 bg-[#F5E6D3] rounded"></div> Salon</div>
            <div className="flex items-center gap-1"><div className="w-4 h-4 bg-[#D3E4F5] rounded"></div> {nbChambres} Ch.</div>
            <div className="flex items-center gap-1"><div className="w-4 h-4 bg-[#F5F5D3] rounded"></div> Cuisine</div>
            {sallesDeBain > 0 && (
              <div className="flex items-center gap-1"><div className="w-4 h-4 bg-[#D3F5E6] rounded"></div> {nbSdb} SdB</div>
            )}
            {garage && <div className="flex items-center gap-1"><div className="w-4 h-4 bg-[#E6E6E6] rounded"></div> Garage</div>}
            {piscine && <div className="flex items-center gap-1"><div className="w-4 h-4 bg-[#4FC3F7] rounded"></div> Piscine</div>}
          </div>

          <p className="text-center text-sm text-white/60">
            Surface: {surface}m² | {totalRooms} pièces
          </p>
        </>
      )}
    </div>
  );
}