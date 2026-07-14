import jsPDF from "jspdf";
import html2canvas from "html2canvas";

export interface ReceiptItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface ReceiptData {
  receiptNumber: string;
  date: string;
  time: string;
  clientName: string;
  clientContact?: string;
  items: ReceiptItem[];
  totalAmount: number;
  paymentMethod: string;
  projectName?: string;
  agentName: string;
}

export async function generateReceiptPDF(data: ReceiptData): Promise<void> {
  // Créer un élément temporaire pour le reçu
  const receiptElement = document.createElement("div");
  receiptElement.style.width = "595px"; // A4 width in pixels at 72 DPI
  receiptElement.style.padding = "40px";
  receiptElement.style.fontFamily = "Arial, sans-serif";
  receiptElement.style.color = "#333";
  receiptElement.style.position = "absolute";
  receiptElement.style.left = "-9999px";
  receiptElement.style.background = "white";

  receiptElement.innerHTML = `
    <div style="border: 2px solid #0B5FFF; border-radius: 12px; padding: 30px; background: linear-gradient(135deg, #f8fafc 0%, #ffffff 100%);">
      <!-- En-tête avec logo -->
      <div style="text-align: center; margin-bottom: 30px;">
        <div style="display: inline-flex; align-items: center; justify-content: center; width: 80px; height: 80px; background: linear-gradient(135deg, #0B5FFF, #0D2B6B); border-radius: 20px; margin-bottom: 15px; box-shadow: 0 8px 24px rgba(11,95,255,0.3);">
          <span style="color: white; font-size: 32px; font-weight: bold;">B</span>
        </div>
        <h1 style="margin: 0; color: #0D2B6B; font-size: 28px; font-weight: bold; letter-spacing: -0.5px;">BÂTIZEN CI</h1>
        <p style="margin: 5px 0; color: #6B7280; font-size: 12px; text-transform: uppercase; letter-spacing: 2px;">Construction Technology</p>
        <p style="margin: 5px 0; color: #9CA3AF; font-size: 11px;">🌍 Côte d'Ivoire</p>
      </div>

      <!-- Titre du reçu -->
      <div style="text-align: center; margin: 25px 0;">
        <h2 style="margin: 0; color: #FF6B00; font-size: 22px; font-weight: bold;">REÇU DE PAIEMENT</h2>
        <p style="margin: 5px 0; color: #6B7280; font-size: 13px;">Numéro: <strong style="color: #0D2B6B;">${data.receiptNumber}</strong></p>
      </div>

      <!-- Informations client et date -->
      <div style="display: flex; justify-content: space-between; margin: 25px 0; padding: 20px; background: #F7F9FC; border-radius: 12px; border-left: 4px solid #0B5FFF;">
        <div style="flex: 1;">
          <p style="margin: 0 0 8px 0; color: #6B7280; font-size: 11px; text-transform: uppercase; letter-spacing: 1px;">Client</p>
          <p style="margin: 0; color: #0D2B6B; font-size: 16px; font-weight: bold;">${data.clientName}</p>
          ${data.clientContact ? `<p style="margin: 4px 0 0 0; color: #6B7280; font-size: 13px;">${data.clientContact}</p>` : ''}
        </div>
        <div style="flex: 1; text-align: right;">
          <p style="margin: 0 0 8px 0; color: #6B7280; font-size: 11px; text-transform: uppercase; letter-spacing: 1px;">Date & Heure</p>
          <p style="margin: 0; color: #0D2B6B; font-size: 14px; font-weight: bold;">${data.date}</p>
          <p style="margin: 4px 0 0 0; color: #6B7280; font-size: 13px;">${data.time}</p>
        </div>
      </div>

      ${data.projectName ? `
      <!-- Nom du projet -->
      <div style="margin: 20px 0; padding: 15px; background: linear-gradient(135deg, rgba(255,107,0,0.1), rgba(255,140,0,0.05)); border-radius: 10px; border-left: 4px solid #FF6B00;">
        <p style="margin: 0 0 5px 0; color: #6B7280; font-size: 11px; text-transform: uppercase; letter-spacing: 1px;">Projet</p>
        <p style="margin: 0; color: #0D2B6B; font-size: 15px; font-weight: bold;">${data.projectName}</p>
      </div>
      ` : ''}

      <!-- Tableau des articles -->
      <div style="margin: 25px 0;">
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr style="background: linear-gradient(135deg, #0B5FFF, #0D2B6B); color: white;">
              <th style="padding: 12px 15px; text-align: left; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; border-radius: 8px 0 0 0;">Description</th>
              <th style="padding: 12px 10px; text-align: center; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Qté</th>
              <th style="padding: 12px 10px; text-align: right; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Prix Unit.</th>
              <th style="padding: 12px 15px; text-align: right; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; border-radius: 0 8px 0 0;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${data.items.map((item, index) => `
              <tr style="${index % 2 === 0 ? 'background: #F7F9FC' : 'background: white'}">
                <td style="padding: 12px 15px; font-size: 13px; color: #111827; border-bottom: 1px solid #E7EBF5;">${item.description}</td>
                <td style="padding: 12px 10px; font-size: 13px; color: #6B7280; text-align: center; border-bottom: 1px solid #E7EBF5;">${item.quantity}</td>
                <td style="padding: 12px 10px; font-size: 13px; color: #6B7280; text-align: right; border-bottom: 1px solid #E7EBF5;">${item.unitPrice.toLocaleString('fr-FR')} FCFA</td>
                <td style="padding: 12px 15px; font-size: 13px; color: #0D2B6B; font-weight: bold; text-align: right; border-bottom: 1px solid #E7EBF5;">${item.total.toLocaleString('fr-FR')} FCFA</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>

      <!-- Total -->
      <div style="margin: 25px 0; padding: 20px; background: linear-gradient(135deg, #0B5FFF, #0D2B6B); border-radius: 12px; color: white; display: flex; justify-content: space-between; align-items: center;">
        <div>
          <p style="margin: 0; font-size: 14px; opacity: 0.9;">MONTANT TOTAL</p>
        </div>
        <div style="text-align: right;">
          <p style="margin: 0; font-size: 28px; font-weight: bold;">${data.totalAmount.toLocaleString('fr-FR')} FCFA</p>
        </div>
      </div>

      <!-- Mode de paiement et agent -->
      <div style="display: flex; gap: 20px; margin: 25px 0;">
        <div style="flex: 1; padding: 15px; background: #F7F9FC; border-radius: 10px; border-left: 4px solid #FF6B00;">
          <p style="margin: 0 0 5px 0; color: #6B7280; font-size: 11px; text-transform: uppercase; letter-spacing: 1px;">Mode de paiement</p>
          <p style="margin: 0; color: #0D2B6B; font-size: 15px; font-weight: bold;">${data.paymentMethod}</p>
        </div>
        <div style="flex: 1; padding: 15px; background: #F7F9FC; border-radius: 10px; border-left: 4px solid #22C55E;">
          <p style="margin: 0 0 5px 0; color: #6B7280; font-size: 11px; text-transform: uppercase; letter-spacing: 1px;">Agent BATIZEN</p>
          <p style="margin: 0; color: #0D2B6B; font-size: 15px; font-weight: bold;">${data.agentName}</p>
        </div>
      </div>

      <!-- Signature -->
      <div style="margin: 30px 0; text-align: center;">
        <div style="display: inline-block; padding: 15px 40px; border: 2px dashed #E7EBF5; border-radius: 10px;">
          <p style="margin: 0; color: #9CA3AF; font-size: 12px; font-style: italic;">Signature et cachet de l'agent</p>
        </div>
      </div>

      <!-- Pied de page -->
      <div style="margin-top: 30px; padding-top: 20px; border-top: 2px solid #E7EBF5; text-align: center;">
        <p style="margin: 0 0 8px 0; color: #0D2B6B; font-size: 14px; font-weight: bold;">BÂTIZEN CI — Construire en confiance</p>
        <p style="margin: 0 0 4px 0; color: #6B7280; font-size: 11px;">📍 Abidjan, Côte d'Ivoire | 📞 +225 07 07 07 07 07</p>
        <p style="margin: 0; color: #6B7280; font-size: 11px;">📧 contact@batizen.ci | 🌐 www.batizen.ci</p>
        <p style="margin: 8px 0 0 0; color: #9CA3AF; font-size: 10px; font-style: italic;">Ce reçu est un document électronique valide sans signature manuscrite</p>
      </div>
    </div>
  `;

  // Ajouter l'élément au document (hors écran)
  document.body.appendChild(receiptElement);

  try {
    // Convertir en canvas
    const canvas = await html2canvas(receiptElement, {
      scale: 2,
      useCORS: true,
      backgroundColor: "#ffffff",
      logging: false,
    });

    // Créer le PDF
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    const imgData = canvas.toDataURL("image/png");
    const pdfWidth = 210; // A4 width in mm
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

    pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
    pdf.save(`Recu_${data.receiptNumber}_${data.clientName.replace(/\s+/g, "_")}.pdf`);
  } catch (error) {
    console.error("Erreur lors de la génération du PDF:", error);
    throw new Error("Échec de la génération du reçu PDF");
  } finally {
    // Supprimer l'élément temporaire
    document.body.removeChild(receiptElement);
  }
}

// Fonction utilitaire pour générer un numéro de reçu
export function generateReceiptNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `RCV-${timestamp}-${random}`;
}

// Fonction utilitaire pour formater la date
export function formatDate(date: Date = new Date()): string {
  return date.toLocaleDateString("fr-FR", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

// Fonction utilitaire pour formater l'heure
export function formatTime(date: Date = new Date()): string {
  return date.toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}