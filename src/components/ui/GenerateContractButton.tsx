"use client";

import { useState } from "react";
import { FileText, Download, CheckCircle2, AlertCircle } from "lucide-react";
import {
  generateContractPDF,
  generateContractNumber,
  formatDateContract,
  type ContractData,
  type ContractParty,
  type ContractService,
  type PaymentSchedule,
} from "@/lib/generateContractPDF";

interface GenerateContractButtonProps {
  client: Omit<ContractParty, "name"> & { name: string };
  projectName: string;
  projectLocation: string;
  services: Omit<ContractService, "total">[];
  totalAmount: number;
  paymentSchedule: Omit<PaymentSchedule, "amount">[];
  startDate: string;
  endDate: string;
  warrantyMonths?: number;
  agentName?: string;
  agentTitle?: string;
  className?: string;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

export function GenerateContractButton({
  client,
  projectName,
  projectLocation,
  services,
  totalAmount,
  paymentSchedule,
  startDate,
  endDate,
  warrantyMonths = 12,
  agentName = "Le Directeur Technique",
  agentTitle = "BÂTIZEN CI",
  className = "",
  onSuccess,
  onError,
}: GenerateContractButtonProps) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (loading) return;

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      // Calculer les totaux pour chaque service
      const servicesWithTotal: ContractService[] = services.map(service => ({
        ...service,
        total: service.unitPrice * service.quantity,
      }));

      // Calculer les montants de l'échéancier
      const paymentScheduleWithAmount: PaymentSchedule[] = paymentSchedule.map(payment => ({
        ...payment,
        amount: payment.percentage 
          ? Math.round(totalAmount * (payment.percentage / 100))
          : totalAmount / paymentSchedule.length,
      }));

      const contractData: ContractData = {
        contractNumber: generateContractNumber(),
        contractDate: formatDateContract(),
        client: client as ContractParty,
        services: servicesWithTotal,
        totalAmount,
        paymentSchedule: paymentScheduleWithAmount,
        projectName,
        projectLocation,
        startDate,
        endDate,
        warrantyMonths,
        agentName,
        agentTitle,
      };

      await generateContractPDF(contractData);
      setSuccess(true);
      onSuccess?.();

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
            <span>Contrat généré avec succès !</span>
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
                <span>Générer le contrat PDF</span>
              </>
            )}
          </>
        )}

        {!loading && !success && (
          <div className="absolute inset-0 overflow-hidden rounded-[20px]">
            <div
              className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 hover:translate-x-full"
              style={{ animation: "shimmer 2s infinite" }}
            />
          </div>
        )}
      </button>

      <div className="mt-3 flex items-center justify-center gap-2 text-xs text-[#6B7280]">
        <FileText size={14} />
        <span>Le PDF sera téléchargé automatiquement</span>
      </div>

      <style jsx>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
}

// Version simplifiée
export function SimpleContractButton({
  clientName,
  projectName,
  totalAmount,
  className = "",
}: {
  clientName: string;
  projectName: string;
  totalAmount: number;
  className?: string;
}) {
  return (
    <GenerateContractButton
      client={{
        name: clientName,
        address: "À compléter",
        phone: "À compléter",
      }}
      projectName={projectName}
      projectLocation="À compléter"
      services={[
        {
          description: "Prestation de services BÂTIZEN",
          unitPrice: totalAmount,
          quantity: 1,
        },
      ]}
      totalAmount={totalAmount}
      paymentSchedule={[
        { label: "Acompte à la signature", percentage: 30, dueDate: "À la signature" },
        { label: "À mi-parcours", percentage: 40, dueDate: "À mi-parcours" },
        { label: "Solde à la livraison", percentage: 30, dueDate: "À la livraison" },
      ]}
      startDate="À définir"
      endDate="À définir"
      className={className}
    />
  );
}