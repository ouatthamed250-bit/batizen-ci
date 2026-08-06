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

const ROW_Y = [123.4, 135.0, 146.6, 158.2, 169.8, 181.4, 193.0, 204.6];

export async function generateDevisPDF(data: DevisData): Promise<Blob> {
  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const img = await loadTemplateImage("/templates/devis-template.jpg");
  pdf.addImage(img, "JPEG", 0, 0, 210, 297);

  pdf.setFont("helvetica", "bold");
  pdf.setTextColor(13, 43, 107);
  pdf.setFontSize(10);

  pdf.text(data.devisNumber, 148.7, 37.7);
  pdf.text(data.devisDate, 141.5, 47.4);
  pdf.text(data.clientName, 139.5, 54.7);
  if (data.clientAdresse) pdf.text(data.clientAdresse, 143.6, 61.9);

  pdf.setFontSize(8.5);
  let totalMateriel = 0;
  data.items.slice(0, 8).forEach((item, i) => {
    const montant = item.quantite * item.prixUnitaire;
    totalMateriel += montant;
    const y = ROW_Y[i];
    pdf.text(String(i + 1), 12.3, y);
    pdf.text(item.designation.slice(0, 30), 27.7, y);
    pdf.text(String(item.quantite), 86.1, y, { align: "center" });
    pdf.text(item.unite.slice(0, 10), 101.5, y);
    pdf.text(fmtFcfa(item.prixUnitaire), 162.0, y, { align: "right" });
    pdf.text(fmtFcfa(montant), 196.9, y, { align: "right" });
  });

  const sousTotal = totalMateriel + data.mainOeuvre;
  const totalHT = sousTotal - data.remise;
  const totalTTC = totalHT;

  pdf.setFontSize(10);
  pdf.text(fmtFcfa(totalMateriel), 184.7, 212.2, { align: "right" });
  pdf.text(fmtFcfa(data.mainOeuvre), 184.7, 218.9, { align: "right" });
  pdf.text(fmtFcfa(sousTotal), 184.7, 225.3, { align: "right" });
  pdf.text(fmtFcfa(data.remise), 184.7, 231.7, { align: "right" });
  pdf.text(fmtFcfa(totalHT), 184.7, 238.1, { align: "right" });
  pdf.text("0", 184.7, 244.4, { align: "right" });

  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(12);
  pdf.text(fmtFcfa(totalTTC), 184.7, 253.3, { align: "right" });

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