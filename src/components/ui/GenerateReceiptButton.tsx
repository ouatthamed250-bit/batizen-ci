"use client";

import { useState } from "react";
import { FileText, Download, CheckCircle2, AlertCircle } from "lucide-react";
import {
  generateReceiptPDF,
  generateReceiptNumber,
  formatDate,
  formatTime,
  type ReceiptData,
  type ReceiptItem,
} from "@/lib/generateReceiptPDF";

interface GenerateReceiptButtonProps {
  clientName: string;
  clientContact?: string;
  projectName?: string;
  items: ReceiptItem[];
  totalAmount: number;
  paymentMethod: string;
  agentName?: string;
  className?: string;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

export function GenerateReceiptButton({
  clientName,
  clientContact,
  projectName,
  items,
  totalAmount,
  paymentMethod,
  agentName = "Agent BÂTIZEN",
  className = "",
  onSuccess,
  onError,
}: GenerateReceiptButtonProps) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (loading) return;

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const receiptData: ReceiptData = {
        receiptNumber: generateReceiptNumber(),
        date: formatDate(),
        time: formatTime(),
        clientName,
        clientContact,
        projectName,
        items,
        totalAmount,
        paymentMethod,
        agentName,
      };

      await generateReceiptPDF(receiptData);
      setSuccess(true);
      onSuccess?.();

      // Reset success state after 3 seconds
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Une erreur est survenue";
      setError(errorMessage);
      onError?.(err instanceof Error ? err : new Error(errorMessage));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={className}>
      <button
        onClick={handleGenerate}
        disabled={loading}
        className={`relative flex items-center justify-center gap-3 rounded-[20px] px-6 py-4 font-bold transition-all active:scale-[0.97] disabled:opacity-60 ${
          success
            ? "bg-gradient-to-r from-[#22C55E] to-[#15803D] text-white shadow-[0_12px_28px_rgba(34,197,94,0.3)]"
            : error
            ? "bg-gradient-to-r from-red-500 to-red-600 text-white shadow-[0_12px_28px_rgba(239,68,68,0.3)]"
            : "bg-gradient-to-r from-[#0B5FFF] to-[#0D2B6B] text-white shadow-[0_12px_28px_rgba(11,95,255,0.3)] hover:shadow-[0_16px_36px_rgba(11,95,255,0.4)]"
        }`}
        style={{
          minHeight: "56px",
        }}
      >
        {success ? (
          <>
            <CheckCircle2 size={22} className="animate-bounce" />
            <span>Reçu généré avec succès !</span>
          </>
        ) : error ? (
          <>
            <AlertCircle size={22} />
            <span>Erreur - Réessayer</span>
          </>
        ) : (
          <>
            {loading ? (
              <>
                <div className="size-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                <span>Génération en cours...</span>
              </>
            ) : (
              <>
                <Download size={22} />
                <span>Générer le reçu PDF</span>
              </>
            )}
          </>
        )}

        {/* Effet de brillance au survol */}
        {!loading && !success && (
          <div className="absolute inset-0 overflow-hidden rounded-[20px]">
            <div
              className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 hover:translate-x-full"
              style={{ animation: "shimmer 2s infinite" }}
            />
          </div>
        )}
      </button>

      {/* Informations supplémentaires */}
      <div className="mt-3 flex items-center justify-center gap-2 text-xs text-[#6B7280]">
        <FileText size={14} />
        <span>Le PDF sera téléchargé automatiquement</span>
      </div>

      {/* Style pour l'animation de brillance */}
      <style jsx>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
}

// Version simplifiée avec props minimales
export function SimpleReceiptButton({
  totalAmount,
  clientName,
  className = "",
}: {
  totalAmount: number;
  clientName: string;
  className?: string;
}) {
  return (
    <GenerateReceiptButton
      clientName={clientName}
      items={[
        {
          description: "Prestation de services BÂTIZEN",
          quantity: 1,
          unitPrice: totalAmount,
          total: totalAmount,
        },
      ]}
      totalAmount={totalAmount}
      paymentMethod="Espèces"
      className={className}
    />
  );
}