"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { Pencil, Eraser, Check, X } from "lucide-react";

interface SignaturePadProps {
  onSignature?: (signatureData: string) => void;
  onClear?: () => void;
  width?: number;
  height?: number;
  className?: string;
  disabled?: boolean;
  penColor?: string;
  backgroundColor?: string;
  lineWidth?: number;
}

export function SignaturePad({
  onSignature,
  onClear,
  width = 400,
  height = 200,
  className = "",
  disabled = false,
  penColor = "#0D2B6B",
  backgroundColor = "#F7F9FC",
  lineWidth = 2,
}: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const [lastPos, setLastPos] = useState({ x: 0, y: 0 });

  // Initialiser le canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Configurer le contexte
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = penColor;
    ctx.lineWidth = lineWidth;

    // Remplir le fond
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, width, height);

    // Ajouter une ligne pointillée pour guider
    ctx.setLineDash([5, 5]);
    ctx.strokeStyle = "#E7EBF5";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(20, height - 40);
    ctx.lineTo(width - 20, height - 40);
    ctx.stroke();

    // Texte indicatif
    ctx.font = "12px Arial";
    ctx.fillStyle = "#9CA3AF";
    ctx.textAlign = "center";
    ctx.fillText("Signez ici", width / 2, height - 25);

    ctx.setLineDash([]);
  }, [width, height, penColor, backgroundColor, lineWidth]);

  // Obtenir les coordonnées de la souris/doigt
  const getCoordinates = useCallback(
    (event: React.MouseEvent | React.TouchEvent): { x: number; y: number } | null => {
      const canvas = canvasRef.current;
      if (!canvas) return null;

      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;

      if ("touches" in event) {
        if (event.touches.length === 0) return null;
        return {
          x: (event.touches[0].clientX - rect.left) * scaleX,
          y: (event.touches[0].clientY - rect.top) * scaleY,
        };
      } else {
        return {
          x: (event.clientX - rect.left) * scaleX,
          y: (event.clientY - rect.top) * scaleY,
        };
      }
    },
    []
  );

  // Commencer le dessin
  const startDrawing = useCallback(
    (event: React.MouseEvent | React.TouchEvent) => {
      if (disabled) return;
      event.preventDefault();

      const coords = getCoordinates(event);
      if (!coords) return;

      setIsDrawing(true);
      setLastPos(coords);
      setHasSignature(true);

      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");
      if (!ctx) return;

      ctx.beginPath();
      ctx.moveTo(coords.x, coords.y);
    },
    [disabled, getCoordinates]
  );

  // Dessiner
  const draw = useCallback(
    (event: React.MouseEvent | React.TouchEvent) => {
      if (!isDrawing || disabled) return;
      event.preventDefault();

      const coords = getCoordinates(event);
      if (!coords) return;

      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");
      if (!ctx) return;

      ctx.beginPath();
      ctx.moveTo(lastPos.x, lastPos.y);
      ctx.lineTo(coords.x, coords.y);
      ctx.strokeStyle = penColor;
      ctx.lineWidth = lineWidth;
      ctx.stroke();

      setLastPos(coords);
    },
    [isDrawing, lastPos, disabled, getCoordinates, penColor, lineWidth]
  );

  // Arrêter le dessin
  const stopDrawing = useCallback(() => {
    if (!isDrawing) return;
    setIsDrawing(false);

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.closePath();

    // Exporter la signature
    if (onSignature && hasSignature) {
      const signatureData = canvas.toDataURL("image/png");
      onSignature(signatureData);
    }
  }, [isDrawing, hasSignature, onSignature]);

  // Effacer le canvas
  const clearCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, width, height);

    // Redessiner la ligne pointillée
    ctx.setLineDash([5, 5]);
    ctx.strokeStyle = "#E7EBF5";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(20, height - 40);
    ctx.lineTo(width - 20, height - 40);
    ctx.stroke();

    ctx.font = "12px Arial";
    ctx.fillStyle = "#9CA3AF";
    ctx.textAlign = "center";
    ctx.fillText("Signez ici", width / 2, height - 25);

    ctx.setLineDash([]);

    setHasSignature(false);
    setLastPos({ x: 0, y: 0 });

    if (onClear) {
      onClear();
    }

    if (onSignature) {
      onSignature("");
    }
  }, [width, height, backgroundColor, onClear, onSignature]);

  // Exporter la signature
  const getSignatureData = useCallback((): string => {
    const canvas = canvasRef.current;
    if (!canvas) return "";
    return canvas.toDataURL("image/png");
  }, []);

  return (
    <div className={`flex flex-col items-center gap-3 ${className}`}>
      <div
        className="relative rounded-xl border-2 border-[#E7EBF5] overflow-hidden shadow-sm"
        style={{
          width: Math.min(width, window.innerWidth - 40),
          height,
        }}
      >
        <canvas
          ref={canvasRef}
          width={width}
          height={height}
          className="cursor-crosshair touch-none"
          style={{
            width: Math.min(width, window.innerWidth - 40),
            height,
          }}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          aria-label="Zone de signature"
        />
      </div>

      {/* Boutons d'action */}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={clearCanvas}
          disabled={disabled || !hasSignature}
          className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold text-[#6B7280] transition-all hover:bg-[#F7F9FC] disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Eraser size={16} />
          <span>Effacer</span>
        </button>

        <button
          type="button"
          onClick={() => {
            if (hasSignature) {
              const signatureData = getSignatureData();
              if (onSignature) {
                onSignature(signatureData);
              }
            }
          }}
          disabled={disabled || !hasSignature}
          className="flex items-center gap-2 rounded-xl bg-[linear-gradient(135deg,#0B5FFF,#0D2B6B)] px-4 py-2 text-sm font-bold text-white shadow-md transition-all hover:shadow-lg disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Check size={16} />
          <span>Valider</span>
        </button>
      </div>

      {/* Indicateur de statut */}
      {hasSignature && (
        <p className="text-xs text-[#22C55E] flex items-center gap-1">
          <Pencil size={12} />
          Signature capturée
        </p>
      )}
    </div>
  );
}

// Hook pour gérer la signature dans un formulaire
export function useSignature() {
  const [signatureData, setSignatureData] = useState<string>("");
  const [isSigned, setIsSigned] = useState(false);

  const handleSignature = useCallback((data: string) => {
    setSignatureData(data);
    setIsSigned(!!data);
  }, []);

  const clearSignature = useCallback(() => {
    setSignatureData("");
    setIsSigned(false);
  }, []);

  return {
    signatureData,
    isSigned,
    handleSignature,
    clearSignature,
  };
}