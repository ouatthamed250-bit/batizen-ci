"use client";

interface PlanGenerator2DProps {
  surface: number;
  largeur: number;
  longueur: number;
  chambres: number;
  sallesDeBain: number;
  etages: number;
  garage: boolean;
  piscine: boolean;
  style?: string;
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
}: PlanGenerator2DProps) {
  // Conversion: 1m = 10px
  const scale = 10;
  const canvasWidth = Math.min(400, largeur * scale + 20);
  const canvasHeight = Math.min(400, longueur * scale + 20);

  // Calcul des pièces
  const salonSurface = Math.floor(surface * 0.3);
  const cuisineSurface = Math.floor(surface * 0.15);
  const chambreSurface = Math.floor((surface - salonSurface - cuisineSurface) / chambres);

  return (
    <div className="space-y-4">
      <canvas
        width={canvasWidth}
        height={canvasHeight}
        className="border-2 border-white/20 rounded-lg bg-white/10"
        style={{ width: "100%", maxWidth: "400px", height: "auto" }}
      />
      
      {/* Légende */}
      <div className="flex flex-wrap gap-3 justify-center text-xs">
        <div className="flex items-center gap-1"><div className="w-4 h-4 bg-[#F5E6D3] rounded"></div> Salon</div>
        <div className="flex items-center gap-1"><div className="w-4 h-4 bg-[#D3E4F5] rounded"></div> Chambres</div>
        <div className="flex items-center gap-1"><div className="w-4 h-4 bg-[#F5F5D3] rounded"></div> Cuisine</div>
        <div className="flex items-center gap-1"><div className="w-4 h-4 bg-[#D3F5E6] rounded"></div> SdB</div>
        <div className="flex items-center gap-1"><div className="w-4 h-4 bg-[#E6E6E6] rounded"></div> Garage</div>
      </div>

      <div className="flex gap-2 justify-center">
        <button className="px-4 py-2 rounded-lg bg-white/20 text-white text-sm font-bold">
          📥 Télécharger PNG
        </button>
      </div>
    </div>
  );
}