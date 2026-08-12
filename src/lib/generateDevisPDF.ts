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

const ROW_Y = [98.8, 107.0, 115.3, 123.5, 131.7, 139.9, 148.1, 156.3];

export async function generateDevisPDF(data: DevisData): Promise<Blob> {
  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const img = await loadTemplateImage("/templates/devis-template.jpg");
  pdf.addImage(img, "JPEG", 0, 0, 210, 297);

  pdf.setFont("helvetica", "bold");
  pdf.setTextColor(13, 43, 107);
  pdf.setFontSize(10);

  pdf.text(data.devisNumber, 124.1, 34.5);
  pdf.text(data.devisDate, 124.1, 43.7);
  pdf.text(data.clientName, 48.2, 65.2);
  if (data.clientAdresse) pdf.text(data.clientAdresse, 48.2, 73.4);

  pdf.setFontSize(8.5);
  let totalMateriel = 0;
  data.items.slice(0, 8).forEach((item, i) => {
    const montant = item.quantite * item.prixUnitaire;
    totalMateriel += montant;
    const y = ROW_Y[i];
    pdf.text(item.designation.slice(0, 32), 21.5, y);
    pdf.text(String(item.quantite), 102.9, y, { align: "center" });
    pdf.text(item.unite.slice(0, 10), 121.0, y);
    pdf.text(fmtFcfa(item.prixUnitaire), 171.2, y, { align: "right" });
    pdf.text(fmtFcfa(montant), 204.0, y, { align: "right" });
  });

  const sousTotal = totalMateriel + data.mainOeuvre;
  const totalHT = sousTotal - data.remise;
  const fraisSuivi = Math.round(totalHT * 0.05);
  const totalTTC = totalHT + fraisSuivi;

  pdf.setFontSize(10);
  pdf.text(fmtFcfa(totalMateriel), 192.8, 171.4, { align: "right" });
  pdf.text(fmtFcfa(data.mainOeuvre), 192.8, 179.1, { align: "right" });
  pdf.text(fmtFcfa(sousTotal), 192.8, 186.8, { align: "right" });
  pdf.text(fmtFcfa(data.remise), 192.8, 194.6, { align: "right" });
  pdf.text(fmtFcfa(totalHT), 192.8, 202.3, { align: "right" });
  pdf.text(fmtFcfa(fraisSuivi), 192.8, 210.0, { align: "right" });

  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(12);
  pdf.text(fmtFcfa(totalTTC), 192.8, 217.0, { align: "right" });

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