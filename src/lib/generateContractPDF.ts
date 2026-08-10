import jsPDF from "jspdf";

export interface EcheancierRow {
  description: string;
  date: string;
  montant: number;
}

export interface ContractData {
  contractNumber: string;
  contractDate: string;
  clientName: string;
  clientPhone?: string;
  clientEmail?: string;
  clientAdresse?: string;
  clientVille?: string;
  chantierLieu?: string;
  chantierType?: string;
  surfaceEstimee?: number;
  descriptionTravaux: string;
  prestations: string[];
  prestationAutre?: string;
  dateDebut: string;
  dateFin: string;
  dureeEstimee: string;
  montantTotal: number;
  acomptePourcent: number;
  echeancier: EcheancierRow[];
  notes?: string;
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

function fmtDateFr(iso: string): string {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  if (!y || !m || !d) return iso;
  return `${d}/${m}/${y}`;
}

const TYPE_POS: Record<string, { x: number; y: number }> = {
  villa: { x: 108.7, y: 65.0 },
  maison: { x: 108.7, y: 65.0 },
  duplex: { x: 108.7, y: 69.3 },
  immeuble: { x: 108.7, y: 73.8 },
  commerce: { x: 149.7, y: 65.0 },
  entrepot: { x: 149.7, y: 69.3 },
  renovation: { x: 149.7, y: 73.8 },
  autre: { x: 149.7, y: 73.8 },
};

const PRESTATION_POS: Record<string, { x: number; y: number }> = {
  etude: { x: 8.2, y: 115.3 },
  plans: { x: 8.2, y: 120.0 },
  devis: { x: 8.2, y: 124.7 },
  gros_oeuvre: { x: 8.2, y: 129.2 },
  second_oeuvre: { x: 8.2, y: 133.7 },
  finitions: { x: 69.7, y: 115.3 },
  suivi: { x: 69.7, y: 120.0 },
  livraison: { x: 69.7, y: 124.7 },
  assistance: { x: 69.7, y: 129.2 },
  autre: { x: 69.7, y: 133.7 },
};

export async function generateContractPDF(data: ContractData): Promise<Blob> {
  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const img = await loadTemplateImage("/templates/contract-template.jpg");
  pdf.addImage(img, "JPEG", 0, 0, 210, 297);

  pdf.setFont("helvetica", "bold");
  pdf.setTextColor(13, 43, 107);
  pdf.setFontSize(10);

  pdf.text(data.contractNumber, 39.0, 43.7);
  pdf.text(data.contractDate, 143.6, 43.7);

  pdf.text(data.clientName, 40.0, 55.4);
  if (data.clientPhone) pdf.text(data.clientPhone, 40.0, 60.1);
  if (data.clientEmail) pdf.text(data.clientEmail, 35.9, 64.8);
  if (data.clientAdresse) pdf.text(data.clientAdresse, 40.0, 69.3);
  if (data.clientVille) pdf.text(data.clientVille, 31.8, 73.8);

  if (data.chantierLieu) pdf.text(data.chantierLieu, 133.3, 55.4);
  const typePos = TYPE_POS[(data.chantierType || "").toLowerCase()];
  if (typePos) { pdf.setFontSize(9); pdf.text("X", typePos.x, typePos.y); pdf.setFontSize(10); }
  if (data.surfaceEstimee) pdf.text(String(data.surfaceEstimee), 133.3, 79.6);

  pdf.setFontSize(8.5);
  const descLines = pdf.splitTextToSize(data.descriptionTravaux || "", 110);
  descLines.slice(0, 4).forEach((line: string, i: number) => {
    pdf.text(line, 8.2, 84.1 + i * 5.2);
  });

  pdf.setFontSize(9);
  data.prestations.forEach((key) => {
    const pos = PRESTATION_POS[key];
    if (pos) pdf.text("X", pos.x, pos.y);
  });
  if (data.prestations.includes("autre") && data.prestationAutre) {
    pdf.setFontSize(7.5);
    pdf.text(data.prestationAutre.slice(0, 18), 82, 133.7);
  }

  pdf.setFontSize(10);
  pdf.text(fmtDateFr(data.dateDebut), 135.4, 122.0);
  pdf.text(fmtDateFr(data.dateFin), 135.4, 129.6);
  pdf.text(data.dureeEstimee, 135.4, 137.2);

  const fraisSuivi = Math.round(data.montantTotal * 0.05);
  const montantTotalTTC = data.montantTotal + fraisSuivi;
  pdf.text(fmtFcfa(montantTotalTTC), 193.8, 149.3, { align: "right" });
  pdf.setFontSize(9);
  pdf.text(String(data.acomptePourcent), 57.4, 154.4);
  pdf.setFontSize(10);
  const montantAcompte = Math.round((data.montantTotal * data.acomptePourcent) / 100);
  pdf.text(fmtFcfa(montantAcompte), 193.8, 154.4, { align: "right" });
  const resteAPayer = montantTotalTTC - montantAcompte;
  pdf.text(fmtFcfa(resteAPayer), 193.8, 164.7, { align: "right" });
  pdf.text(fmtFcfa(fraisSuivi), 193.8, 159.6, { align: "right" });

  pdf.setFontSize(8.5);
  const echRows = [200.6, 205.9, 211.2, 216.6];
  data.echeancier.slice(0, 4).forEach((row, i) => {
    pdf.text(row.description.slice(0, 20), 47.2, echRows[i]);
    pdf.text(fmtDateFr(row.date), 123.0, echRows[i]);
    pdf.text(fmtFcfa(row.montant), 196.9, echRows[i], { align: "right" });
  });

  if (data.notes) {
    pdf.setFontSize(8.5);
    const notesLines = pdf.splitTextToSize(data.notes, 80);
    notesLines.slice(0, 3).forEach((line: string, i: number) => {
      pdf.text(line, 123.0, 229.7 + i * 5.2);
    });
  }

  return pdf.output("blob");
}

export function generateContractNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `CTR-${timestamp}-${random}`;
}

export function formatDateContract(date: Date = new Date()): string {
  return date.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });
}