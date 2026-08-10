import jsPDF from "jspdf";

export interface DevisItem {
  designation: string;
  quantite: number;
  unite: string;
  prixUnitaire: number;
}

export interface DevisData {
  devisNumber: string;
  devisDate: string;
  clientName: string;
  clientAdresse?: string;
  items: DevisItem[];
  mainOeuvre: number;
  remise: number;
}

function loadTemplateImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function fmtFcfa(n: number): string {
  return n.toLocaleString("fr-FR").replace(/[\u202f\u00a0]/g, " ");
}

const ROW_Y = [76.9, 85.1, 93.3, 101.5, 109.7, 117.9, 126.1, 134.3];

export async function generateDevisPDF(data: DevisData): Promise<Blob> {
  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const img = await loadTemplateImage("/templates/devis-template.jpg");
  pdf.addImage(img, "JPEG", 0, 0, 210, 297);

  pdf.setFont("helvetica", "bold");
  pdf.setTextColor(13, 43, 107);
  pdf.setFontSize(10);

  pdf.text(data.devisNumber, 147.7, 20.5);
  pdf.text(data.devisDate, 147.7, 25.8);
  pdf.text(data.clientName, 46.1, 39.4);
  if (data.clientAdresse) pdf.text(data.clientAdresse, 46.1, 46.7);

  pdf.setFontSize(8.5);
  let totalMateriel = 0;
  data.items.slice(0, 8).forEach((item, i) => {
    const montant = item.quantite * item.prixUnitaire;
    totalMateriel += montant;
    const y = ROW_Y[i];
    pdf.text(item.designation.slice(0, 32), 22.6, y);
    pdf.text(String(item.quantite), 124.1, y, { align: "center" });
    pdf.text(item.unite.slice(0, 10), 140.5, y);
    pdf.text(fmtFcfa(item.prixUnitaire), 168.2, y, { align: "right" });
    pdf.text(fmtFcfa(montant), 202.0, y, { align: "right" });
  });

  const sousTotal = totalMateriel + data.mainOeuvre;
  const totalHT = sousTotal - data.remise;
  const fraisSuivi = Math.round(totalHT * 0.05);
  const totalTTC = totalHT + fraisSuivi;

  pdf.setFontSize(10);
  pdf.text(fmtFcfa(totalMateriel), 192.8, 165.1, { align: "right" });
  pdf.text(fmtFcfa(data.mainOeuvre), 192.8, 171.9, { align: "right" });
  pdf.text(fmtFcfa(sousTotal), 192.8, 178.9, { align: "right" });
  pdf.text(fmtFcfa(data.remise), 192.8, 185.8, { align: "right" });
  pdf.text(fmtFcfa(totalHT), 192.8, 192.8, { align: "right" });
  pdf.text(fmtFcfa(fraisSuivi), 192.8, 199.7, { align: "right" });

  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(12);
  pdf.text(fmtFcfa(totalTTC), 192.8, 207.7, { align: "right" });

  return pdf.output("blob");
}

export function generateDevisNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `DEV-${timestamp}-${random}`;
}

export function formatDateDevis(date: Date = new Date()): string {
  return date.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });
}