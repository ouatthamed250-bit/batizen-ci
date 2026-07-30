"use client";

import { useEffect, useRef, useState, useMemo, useCallback } from "react";

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

    // ─── Répartition pondérée des surfaces ───
    // Surfaces fixes réservées
    const surfaceSdb = nbSdb * 5;       // 5 m² par salle de bain
    const surfaceGarage = garage ? 15 : 0; // 15 m² pour le garage
    const surfacePiscine = piscine ? 12 : 0; // 12 m² pour la piscine
    const surfaceFixe = surfaceSdb + surfaceGarage + surfacePiscine;
    const surfaceRestante = Math.max(20, surface - surfaceFixe);

    // Répartition du reste
    const surfaceSalon   = Math.round(surfaceRestante * 0.25); // 25% salon
    const surfaceCuisine = Math.round(surfaceRestante * 0.12); // 12% cuisine
    const resteChambres  = Math.max(0, surfaceRestante - surfaceSalon - surfaceCuisine);
    const surfaceChambre = Math.min(Math.max(9, Math.round(resteChambres / nbChambres)), 22);

    // ─── Conversion en pixels ───
    const salonW  = Math.max(50, Math.min(houseWidth * 0.45, surfaceSalon * scale * 0.5));
    const salonH  = Math.max(50, Math.min(houseLength * 0.5, surfaceSalon * scale * 0.4));
    const cuisineW = Math.max(40, Math.min(houseWidth * 0.35, surfaceCuisine * scale * 0.5));
    const cuisineH = Math.max(40, Math.min(houseLength * 0.4, surfaceCuisine * scale * 0.5));
    const chambreDimPx = Math.max(35, Math.min(houseWidth * 0.28, surfaceChambre * scale * 0.5));
    const sdbDimPx = Math.max(25, Math.min(60, 5 * scale * 0.6));

    // ─── Labels de surface ───
    const salonLabel   = `${surfaceSalon}m²`;
    const cuisineLabel = `${surfaceCuisine}m²`;
    const chambreLabel = `${surfaceChambre}m²`;

    // ─── Dessin ───
    ctx.fillStyle = "white";
    ctx.fillRect(offsetX, offsetY, houseWidth, houseLength);
    ctx.strokeStyle = "var(--navy)";
    ctx.lineWidth = 3;
    ctx.strokeRect(offsetX, offsetY, houseWidth, houseLength);

    // Zone jour (bas) : Salon à gauche, Cuisine à droite
    const zoneJourY = offsetY + houseLength - salonH - 10;
    const espace = 8;

    // Salon
    ctx.fillStyle = COLORS.salon;
    ctx.fillRect(offsetX + 10, zoneJourY, salonW, salonH);
    ctx.strokeStyle = "var(--navy)";
    ctx.lineWidth = 2;
    ctx.strokeRect(offsetX + 10, zoneJourY, salonW, salonH);
    ctx.fillStyle = "var(--navy)";
    ctx.font = "11px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("Salon", offsetX + salonW / 2 + 10, zoneJourY + salonH / 2 - 6);
    ctx.font = "9px sans-serif";
    ctx.fillText(salonLabel, offsetX + salonW / 2 + 10, zoneJourY + salonH / 2 + 8);

    // Cuisine
    const cuisineX = offsetX + houseWidth - cuisineW - 10;
    const cuisineY = zoneJourY + salonH - cuisineH;
    ctx.fillStyle = COLORS.cuisine;
    ctx.fillRect(cuisineX, cuisineY, cuisineW, cuisineH);
    ctx.strokeRect(cuisineX, cuisineY, cuisineW, cuisineH);
    ctx.fillStyle = "var(--navy)";
    ctx.font = "11px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("Cuisine", cuisineX + cuisineW / 2, cuisineY + cuisineH / 2 - 6);
    ctx.font = "9px sans-serif";
    ctx.fillText(cuisineLabel, cuisineX + cuisineW / 2, cuisineY + cuisineH / 2 + 8);

    // Zone nuit (haut)
    const zoneNuitY = offsetY + 10;
    const zoneNuitH = houseLength - salonH - 20 - espace;
    const chambreH = Math.min(chambreDimPx, zoneNuitH * 0.65);
    const chambreW = Math.min(chambreDimPx, (houseWidth - 20 - (nbChambres - 1) * espace) / Math.max(1, nbChambres));

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
      ctx.fillText(chambreLabel, cx + chambreW / 2, zoneNuitY + chambreH / 2 + 8);
    }

    // Salles de bain (en dessous des chambres)
    const sdbH = Math.min(sdbDimPx, zoneNuitH - chambreH - espace);
    const sdbW = Math.min(sdbDimPx, (houseWidth - 20 - (nbSdb - 1) * espace) / Math.max(1, nbSdb));
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

    // Garage (entre zone jour et zone nuit)
    if (garage) {
      const gW = Math.min(houseWidth * 0.35, 15 * scale * 0.4);
      const gH = Math.min(houseLength * 0.2, 15 * scale * 0.3);
      const gX = offsetX + 10;
      const gY = zoneJourY - gH - espace;
      ctx.fillStyle = COLORS.garage;
      ctx.fillRect(gX, gY, gW, gH);
      ctx.strokeRect(gX, gY, gW, gH);
      ctx.fillStyle = "var(--navy)";
      ctx.font = "9px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("Garage 15m²", gX + gW / 2, gY + gH / 2 + 3);
    }

    // Piscine
    if (piscine) {
      const pW = Math.min(houseWidth * 0.2, 12 * scale * 0.3);
      const pH = Math.min(houseLength * 0.1, 12 * scale * 0.2);
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

    ctx.fillStyle = "var(--navy)";
    ctx.font = "10px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("─── 5m", offsetX + houseWidth / 2, offsetY + houseLength + 25);
  }, [surface, largeur, longueur, nbChambres, nbSdb, totalRooms, etages, garage, piscine, style, isLoading]);

  /** Sanitize une chaîne SVG en supprimant tout contenu dangereux (scripts, event handlers, etc.). */
  const sanitizeSvg = useCallback((svgString: string): string => {
    return svgString
      // Supprime les balises <script> et leur contenu
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      // Supprime les attributs on* (onclick, onload, onerror, etc.)
      .replace(/\s+on\w+\s*=\s*(?:"[^"]*"|'[^']*')/gi, '')
      // Supprime les href/javascript:
      .replace(/\s+href\s*=\s*(?:"javascript:[^"]*"|'javascript:[^']*')/gi, '')
      .replace(/\s+xlink:href\s*=\s*(?:"javascript:[^"]*"|'javascript:[^']*')/gi, '')
      // Supprime les balises <foreignObject> (peuvent contenir du HTML)
      .replace(/<foreignObject\b[^>]*>[\s\S]*?<\/foreignObject>/gi, '');
  }, []);

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
            <button onClick={downloadPNG} className="flex items-center gap-2 px-4 py-2 rounded-xl border border-white/20 bg-white/10 font-semibold text-white transition hover:bg-white/20">
              📥 Télécharger PNG
            </button>
          </div>
          <div className="flex flex-wrap gap-3 justify-center text-xs">
            <div className="flex items-center gap-1"><div className="w-4 h-4 bg-[#F5E6D3] rounded"></div> Salon</div>
            <div className="flex items-center gap-1"><div className="w-4 h-4 bg-[#D3E4F5] rounded"></div> {nbChambres} Ch.</div>
            <div className="flex items-center gap-1"><div className="w-4 h-4 bg-[#F5F5D3] rounded"></div> Cuisine</div>
            {nbSdb > 0 && <div className="flex items-center gap-1"><div className="w-4 h-4 bg-[#D3F5E6] rounded"></div> {nbSdb} SdB</div>}
            {garage && <div className="flex items-center gap-1"><div className="w-4 h-4 bg-[#E6E6E6] rounded"></div> Garage</div>}
            {piscine && <div className="flex items-center gap-1"><div className="w-4 h-4 bg-[#4FC3F7] rounded"></div> Piscine</div>}
          </div>
          <p className="text-center text-sm text-white/60">Surface: {surface}m² | {totalRooms} pièces</p>
        </>
      )}
    </div>
  );
}