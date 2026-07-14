import jsPDF from "jspdf";
import html2canvas from "html2canvas";

export interface ContractParty {
  name: string;
  address: string;
  phone: string;
  email?: string;
  cni?: string; // Numéro CNI
}

export interface ContractService {
  description: string;
  details?: string[];
  unitPrice: number;
  quantity: number;
  total: number;
}

export interface PaymentSchedule {
  label: string;
  amount: number;
  dueDate: string;
  percentage?: number;
}

export interface ContractData {
  contractNumber: string;
  contractDate: string;
  client: ContractParty;
  services: ContractService[];
  totalAmount: number;
  paymentSchedule: PaymentSchedule[];
  projectName: string;
  projectLocation: string;
  startDate: string;
  endDate: string;
  warrantyMonths: number;
  agentName: string;
  agentTitle: string;
  clientSignature?: string; // Signature du client en base64
  agentSignature?: string; // Signature de l'agent en base64
}

export async function generateContractPDF(data: ContractData): Promise<void> {
  const contractElement = document.createElement("div");
  contractElement.style.width = "595px";
  contractElement.style.padding = "40px";
  contractElement.style.fontFamily = "Arial, sans-serif";
  contractElement.style.color = "#333";
  contractElement.style.position = "absolute";
  contractElement.style.left = "-9999px";
  contractElement.style.background = "white";
  contractElement.style.lineHeight = "1.6";

  contractElement.innerHTML = `
    <div style="border: 2px solid #0B5FFF; border-radius: 12px; padding: 30px; background: white;">
      <!-- En-tête avec logo -->
      <div style="text-align: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 3px solid #0B5FFF;">
        <div style="display: inline-flex; align-items: center; justify-content: center; width: 80px; height: 80px; background: linear-gradient(135deg, #0B5FFF, #0D2B6B); border-radius: 20px; margin-bottom: 15px; box-shadow: 0 8px 24px rgba(11,95,255,0.3);">
          <span style="color: white; font-size: 32px; font-weight: bold;">B</span>
        </div>
        <h1 style="margin: 0; color: #0D2B6B; font-size: 26px; font-weight: bold;">BÂTIZEN CI</h1>
        <p style="margin: 5px 0; color: #6B7280; font-size: 11px; text-transform: uppercase; letter-spacing: 2px;">Construction Technology</p>
        <p style="margin: 5px 0; color: #9CA3AF; font-size: 10px;">📍 Abidjan, Côte d'Ivoire | 📞 +225 07 07 07 07 07</p>
      </div>

      <!-- Titre du contrat -->
      <div style="text-align: center; margin: 30px 0;">
        <h2 style="margin: 0; color: #FF6B00; font-size: 22px; font-weight: bold; text-transform: uppercase;">CONTRAT DE PRESTATION DE SERVICES</h2>
        <p style="margin: 8px 0; color: #6B7280; font-size: 13px;">N° <strong style="color: #0D2B6B;">${data.contractNumber}</strong></p>
        <p style="margin: 0; color: #6B7280; font-size: 12px;">Date : ${data.contractDate}</p>
      </div>

      <!-- Projet -->
      <div style="margin: 25px 0; padding: 20px; background: linear-gradient(135deg, rgba(11,95,255,0.05), rgba(13,43,107,0.05)); border-radius: 10px; border-left: 4px solid #0B5FFF;">
        <h3 style="margin: 0 0 12px 0; color: #0D2B6B; font-size: 15px; font-weight: bold; text-transform: uppercase;">Objet du contrat</h3>
        <p style="margin: 0 0 5px 0; color: #111827; font-size: 14px;"><strong>Projet :</strong> ${data.projectName}</p>
        <p style="margin: 0 0 5px 0; color: #111827; font-size: 14px;"><strong>Lieu :</strong> ${data.projectLocation}</p>
        <p style="margin: 0 0 5px 0; color: #111827; font-size: 14px;"><strong>Durée :</strong> Du ${data.startDate} au ${data.endDate}</p>
        <p style="margin: 0; color: #111827; font-size: 14px;"><strong>Garantie :</strong> ${data.warrantyMonths} mois</p>
      </div>

      <!-- Parties -->
      <div style="margin: 25px 0;">
        <h3 style="margin: 0 0 15px 0; color: #0D2B6B; font-size: 15px; font-weight: bold; text-transform: uppercase; border-bottom: 2px solid #E7EBF5; padding-bottom: 8px;">Parties contractantes</h3>
        
        <div style="display: flex; gap: 20px; margin-bottom: 15px;">
          <div style="flex: 1; padding: 15px; background: #F7F9FC; border-radius: 10px; border-left: 4px solid #0B5FFF;">
            <p style="margin: 0 0 8px 0; color: #6B7280; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; font-weight: bold;">Le Prestataire</p>
            <p style="margin: 0; color: #0D2B6B; font-size: 14px; font-weight: bold;">BÂTIZEN CI</p>
            <p style="margin: 3px 0 0 0; color: #6B7280; font-size: 12px;">Société de construction et rénovation</p>
            <p style="margin: 3px 0 0 0; color: #6B7280; font-size: 12px;">Abidjan, Côte d'Ivoire</p>
            <p style="margin: 3px 0 0 0; color: #6B7280; font-size: 12px;">📞 +225 07 07 07 07 07</p>
            <p style="margin: 3px 0 0 0; color: #6B7280; font-size: 12px;">📧 contact@batizen.ci</p>
          </div>
          
          <div style="flex: 1; padding: 15px; background: #F7F9FC; border-radius: 10px; border-left: 4px solid #FF6B00;">
            <p style="margin: 0 0 8px 0; color: #6B7280; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; font-weight: bold;">Le Client</p>
            <p style="margin: 0; color: #0D2B6B; font-size: 14px; font-weight: bold;">${data.client.name}</p>
            <p style="margin: 3px 0 0 0; color: #6B7280; font-size: 12px;">📍 ${data.client.address}</p>
            <p style="margin: 3px 0 0 0; color: #6B7280; font-size: 12px;">📞 ${data.client.phone}</p>
            ${data.client.email ? `<p style="margin: 3px 0 0 0; color: #6B7280; font-size: 12px;">📧 ${data.client.email}</p>` : ''}
            ${data.client.cni ? `<p style="margin: 3px 0 0 0; color: #6B7280; font-size: 12px;">CNI : ${data.client.cni}</p>` : ''}
          </div>
        </div>
      </div>

      <!-- Services -->
      <div style="margin: 25px 0;">
        <h3 style="margin: 0 0 15px 0; color: #0D2B6B; font-size: 15px; font-weight: bold; text-transform: uppercase; border-bottom: 2px solid #E7EBF5; padding-bottom: 8px;">Description des prestations</h3>
        
        <table style="width: 100%; border-collapse: collapse; margin: 15px 0;">
          <thead>
            <tr style="background: linear-gradient(135deg, #0B5FFF, #0D2B6B); color: white;">
              <th style="padding: 12px 15px; text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; border-radius: 8px 0 0 0;">Description</th>
              <th style="padding: 12px 10px; text-align: center; font-size: 11px; text-transform: uppercase; letter-spacing: 1px;">Qté</th>
              <th style="padding: 12px 10px; text-align: right; font-size: 11px; text-transform: uppercase; letter-spacing: 1px;">P.U. (FCFA)</th>
              <th style="padding: 12px 15px; text-align: right; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; border-radius: 0 8px 0 0;">Total (FCFA)</th>
            </tr>
          </thead>
          <tbody>
            ${data.services.map((service, index) => `
              <tr style="${index % 2 === 0 ? 'background: #F7F9FC' : 'background: white'}">
                <td style="padding: 12px 15px; font-size: 12px; color: #111827; border-bottom: 1px solid #E7EBF5;">
                  ${service.description}
                  ${service.details ? `<ul style="margin: 5px 0 0 0; padding-left: 15px; font-size: 11px; color: #6B7280;">${service.details.map(d => `<li>${d}</li>`).join('')}</ul>` : ''}
                </td>
                <td style="padding: 12px 10px; font-size: 12px; color: #6B7280; text-align: center; border-bottom: 1px solid #E7EBF5;">${service.quantity}</td>
                <td style="padding: 12px 10px; font-size: 12px; color: #6B7280; text-align: right; border-bottom: 1px solid #E7EBF5;">${service.unitPrice.toLocaleString('fr-FR')}</td>
                <td style="padding: 12px 15px; font-size: 12px; color: #0D2B6B; font-weight: bold; text-align: right; border-bottom: 1px solid #E7EBF5;">${service.total.toLocaleString('fr-FR')}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>

      <!-- Total -->
      <div style="margin: 25px 0; padding: 20px; background: linear-gradient(135deg, #0B5FFF, #0D2B6B); border-radius: 12px; color: white; display: flex; justify-content: space-between; align-items: center;">
        <div>
          <p style="margin: 0; font-size: 14px; opacity: 0.9;">MONTANT TOTAL DU CONTRAT</p>
        </div>
        <div style="text-align: right;">
          <p style="margin: 0; font-size: 26px; font-weight: bold;">${data.totalAmount.toLocaleString('fr-FR')} FCFA</p>
        </div>
      </div>

      <!-- Échéancier -->
      <div style="margin: 25px 0;">
        <h3 style="margin: 0 0 15px 0; color: #0D2B6B; font-size: 15px; font-weight: bold; text-transform: uppercase; border-bottom: 2px solid #E7EBF5; padding-bottom: 8px;">Échéancier de paiement</h3>
        
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr style="background: #F7F9FC;">
              <th style="padding: 12px 15px; text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #6B7280; border-radius: 8px 0 0 0;">Échéance</th>
              <th style="padding: 12px 10px; text-align: center; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #6B7280;">%</th>
              <th style="padding: 12px 15px; text-align: right; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #6B7280; border-radius: 0 8px 0 0;">Montant (FCFA)</th>
            </tr>
          </thead>
          <tbody>
            ${data.paymentSchedule.map((payment, index) => `
              <tr style="${index % 2 === 0 ? 'background: white' : 'background: #F7F9FC'}">
                <td style="padding: 12px 15px; font-size: 13px; color: #111827; border-bottom: 1px solid #E7EBF5;">${payment.label} - ${payment.dueDate}</td>
                ${payment.percentage ? `<td style="padding: 12px 10px; font-size: 13px; color: #6B7280; text-align: center; border-bottom: 1px solid #E7EBF5;">${payment.percentage}%</td>` : '<td style="padding: 12px 10px;"></td>'}
                <td style="padding: 12px 15px; font-size: 13px; color: #0D2B6B; font-weight: bold; text-align: right; border-bottom: 1px solid #E7EBF5;">${payment.amount.toLocaleString('fr-FR')}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>

      <!-- Clauses légales -->
      <div style="margin: 30px 0; padding: 20px; background: #F7F9FC; border-radius: 10px; border-left: 4px solid #22C55E;">
        <h3 style="margin: 0 0 15px 0; color: #0D2B6B; font-size: 14px; font-weight: bold; text-transform: uppercase;">Clauses et conditions</h3>
        
        <div style="margin-bottom: 12px;">
          <p style="margin: 0 0 5px 0; color: #0D2B6B; font-size: 12px; font-weight: bold;">1. Garantie</p>
          <p style="margin: 0; color: #6B7280; font-size: 11px; line-height: 1.5;">Tous les travaux réalisés par BÂTIZEN CI bénéficient d'une garantie de ${data.warrantyMonths} mois couvrant les défauts de fabrication et de pose. Cette garantie ne couvre pas les dommages résultant d'une utilisation non conforme ou d'un défaut d'entretien.</p>
        </div>
        
        <div style="margin-bottom: 12px;">
          <p style="margin: 0 0 5px 0; color: #0D2B6B; font-size: 12px; font-weight: bold;">2. Délais</p>
          <p style="margin: 0; color: #6B7280; font-size: 11px; line-height: 1.5;">Les délais de réalisation sont indiqués à titre indicatif et peuvent être ajustés en cas de contraintes météorologiques, de difficultés techniques imprévues ou de modifications demandées par le client en cours de projet.</p>
        </div>
        
        <div style="margin-bottom: 12px;">
          <p style="margin: 0 0 5px 0; color: #0D2B6B; font-size: 12px; font-weight: bold;">3. Responsabilités</p>
          <p style="margin: 0; color: #6B7280; font-size: 11px; line-height: 1.5;">BÂTIZEN CI s'engage à réaliser les travaux dans les règles de l'art et conformément aux normes en vigueur. Le client s'engage à fournir un accès au chantier et à respecter les échéances de paiement convenues.</p>
        </div>
        
        <div>
          <p style="margin: 0 0 5px 0; color: #0D2B6B; font-size: 12px; font-weight: bold;">4. Résiliation</p>
          <p style="margin: 0; color: #6B7280; font-size: 11px; line-height: 1.5;">En cas de non-respect des conditions du présent contrat par l'une des parties, l'autre partie pourra résilier le contrat après mise en demeure restée sans effet pendant 15 jours.</p>
        </div>
      </div>

      <!-- Signatures -->
      <div style="margin: 40px 0;">
        <h3 style="margin: 0 0 20px 0; color: #0D2B6B; font-size: 14px; font-weight: bold; text-transform: uppercase; text-align: center;">Signatures</h3>
        
        <div style="display: flex; gap: 40px; justify-content: space-between;">
          <div style="flex: 1; text-align: center;">
            ${data.clientSignature ? `
              <div style="padding: 10px; border: 1px solid #E7EBF5; border-radius: 10px; margin-bottom: 10px; min-height: 80px; display: flex; align-items: center; justify-content: center; background: white;">
                <img src="${data.clientSignature}" alt="Signature client" style="max-width: 100%; max-height: 60px;" />
              </div>
            ` : `
              <div style="padding: 30px 20px; border: 2px dashed #E7EBF5; border-radius: 10px; margin-bottom: 10px; min-height: 80px;">
                <p style="margin: 0; color: #9CA3AF; font-size: 11px; font-style: italic;">Le Client</p>
              </div>
            `}
            <p style="margin: 0; color: #6B7280; font-size: 10px;">Lu et approuvé</p>
            <p style="margin: 3px 0 0 0; color: #0D2B6B; font-size: 11px; font-weight: bold;">${data.client.name}</p>
          </div>
          
          <div style="flex: 1; text-align: center;">
            ${data.agentSignature ? `
              <div style="padding: 10px; border: 1px solid #E7EBF5; border-radius: 10px; margin-bottom: 10px; min-height: 80px; display: flex; align-items: center; justify-content: center; background: white;">
                <img src="${data.agentSignature}" alt="Signature agent" style="max-width: 100%; max-height: 60px;" />
              </div>
            ` : `
              <div style="padding: 30px 20px; border: 2px dashed #E7EBF5; border-radius: 10px; margin-bottom: 10px; min-height: 80px;">
                <p style="margin: 0; color: #9CA3AF; font-size: 11px; font-style: italic;">Pour BÂTIZEN CI</p>
              </div>
            `}
            <p style="margin: 0; color: #6B7280; font-size: 10px;">${data.agentName}</p>
            <p style="margin: 3px 0 0 0; color: #0D2B6B; font-size: 11px; font-weight: bold;">${data.agentTitle}</p>
          </div>
        </div>
      </div>

      <!-- Pied de page -->
      <div style="margin-top: 30px; padding-top: 20px; border-top: 2px solid #E7EBF5; text-align: center;">
        <p style="margin: 0 0 8px 0; color: #0D2B6B; font-size: 13px; font-weight: bold;">BÂTIZEN CI — Construire en confiance</p>
        <p style="margin: 0 0 4px 0; color: #6B7280; font-size: 10px;">RCCM : CI-ABJ-2024-B-XXXXX | N° Contribuable : XXXXX</p>
        <p style="margin: 0 0 4px 0; color: #6B7280; font-size: 10px;">📍 Abidjan, Côte d'Ivoire | 📞 +225 07 07 07 07 07 | 📧 contact@batizen.ci</p>
        <p style="margin: 8px 0 0 0; color: #9CA3AF; font-size: 9px; font-style: italic;">Ce contrat est établi en deux exemplaires originaux. Chaque partie conserve un exemplaire.</p>
      </div>
    </div>
  `;

  document.body.appendChild(contractElement);

  try {
    const canvas = await html2canvas(contractElement, {
      scale: 2,
      useCORS: true,
      backgroundColor: "#ffffff",
      logging: false,
    });

    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    const imgData = canvas.toDataURL("image/png");
    const pdfWidth = 210;
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

    pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
    pdf.save(`Contrat_${data.contractNumber}_${data.client.name.replace(/\s+/g, "_")}.pdf`);
  } catch (error) {
    console.error("Erreur lors de la génération du PDF:", error);
    throw new Error("Échec de la génération du contrat PDF");
  } finally {
    document.body.removeChild(contractElement);
  }
}

// Fonction utilitaire pour générer un numéro de contrat
export function generateContractNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `CTR-${timestamp}-${random}`;
}

// Fonction utilitaire pour formater la date
export function formatDateContract(date: Date = new Date()): string {
  return date.toLocaleDateString("fr-FR", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

// Fonction utilitaire pour ajouter des mois à une date
export function addMonths(date: Date, months: number): Date {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
}