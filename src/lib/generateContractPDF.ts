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
  villa: { x: 110.7, y: 63.3 },
  maison: { x: 110.7, y: 63.3 },
  duplex: { x: 134.3, y: 63.3 },
  immeuble: { x: 156.3, y: 63.3 },
  commerce: { x: 110.7, y: 69.1 },
  entrepot: { x: 134.3, y: 69.1 },
  renovation: { x: 156.3, y: 69.1 },
  autre: { x: 156.3, y: 69.1 },
};

const PRESTATION_POS: Record<string, { x: number; y: number }> = {
  etude: { x: 9.2, y: 115.6 },
  plans: { x: 9.2, y: 120.3 },
  devis: { x: 9.2, y: 124.8 },
  gros_oeuvre: { x: 9.2, y: 129.2 },
  second_oeuvre: { x: 9.2, y: 133.8 },
  finitions: { x: 55.4, y: 115.6 },
  suivi: { x: 55.4, y: 120.3 },
  livraison: { x: 55.4, y: 124.8 },
  assistance: { x: 55.4, y: 129.2 },
  autre: { x: 55.4, y: 133.8 },
};

export async function generateContractPDF(data: ContractData): Promise<Blob> {
  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const img = await loadTemplateImage("/templates/contract-template.jpg");
  pdf.addImage(img, "JPEG", 0, 0, 210, 297);

  pdf.setFont("helvetica", "bold");
  pdf.setTextColor(13, 43, 107);
  pdf.setFontSize(10);

  pdf.text(data.contractNumber, 130.2, 30.4);
  pdf.text(data.contractDate, 130.2, 36.6);

  pdf.text(data.clientName, 26.7, 52.8);
  if (data.clientPhone) pdf.text(data.clientPhone, 26.7, 57.6);
  if (data.clientEmail) pdf.text(data.clientEmail, 26.7, 62.7);
  if (data.clientAdresse) pdf.text(data.clientAdresse, 26.7, 67.7);
  if (data.clientVille) pdf.text(data.clientVille, 26.7, 72.7);

  if (data.chantierLieu) pdf.text(data.chantierLieu, 137.4, 52.8);
  const typePos = TYPE_POS[(data.chantierType || "").toLowerCase()];
  if (typePos) { pdf.setFontSize(9); pdf.text("X", typePos.x, typePos.y); pdf.setFontSize(10); }
  if (data.surfaceEstimee) pdf.text(String(data.surfaceEstimee), 137.4, 77.0);

  pdf.setFontSize(8.5);
  const descLines = pdf.splitTextToSize(data.descriptionTravaux || "", 110);
  descLines.slice(0, 4).forEach((line: string, i: number) => {
    pdf.text(line, 9.2, 88.6 + i * 4.9);
  });

  pdf.setFontSize(9);
  data.prestations.forEach((key) => {
    const pos = PRESTATION_POS[key];
    if (pos) pdf.text("X", pos.x, pos.y);
  });
  if (data.prestations.includes("autre") && data.prestationAutre) {
    pdf.setFontSize(7.5);
    pdf.text(data.prestationAutre.slice(0, 18), 62, 133.8);
  }

  pdf.setFontSize(10);
  pdf.text(fmtDateFr(data.dateDebut), 139.5, 117.0);
  pdf.text(fmtDateFr(data.dateFin), 139.5, 124.7);
  pdf.text(data.dureeEstimee, 139.5, 132.4);

  const fraisSuivi = Math.round(data.montantTotal * 0.05);
  const montantTotalTTC = data.montantTotal + fraisSuivi;
  pdf.text(fmtFcfa(montantTotalTTC), 189.7, 149.5, { align: "right" });
  pdf.setFontSize(9);
  pdf.text(String(data.acomptePourcent), 46.1, 155.3);
  pdf.setFontSize(10);
  const montantAcompte = Math.round((data.montantTotal * data.acomptePourcent) / 100);
  pdf.text(fmtFcfa(montantAcompte), 189.7, 155.3, { align: "right" });
  const resteAPayer = montantTotalTTC - montantAcompte;
  pdf.text(fmtFcfa(resteAPayer), 189.7, 166.1, { align: "right" });
  pdf.text(fmtFcfa(fraisSuivi), 189.7, 160.7, { align: "right" });

  pdf.setFontSize(8.5);
  const echRows = [201.7, 206.4, 210.9, 215.1];
  data.echeancier.slice(0, 4).forEach((row, i) => {
    pdf.text(row.description.slice(0, 20), 51.3, echRows[i]);
    pdf.text(fmtDateFr(row.date), 123.0, echRows[i]);
    pdf.text(fmtFcfa(row.montant), 195.9, echRows[i], { align: "right" });
  });

  if (data.notes) {
    pdf.setFontSize(8.5);
    const notesLines = pdf.splitTextToSize(data.notes, 80);
    notesLines.slice(0, 3).forEach((line: string, i: number) => {
      pdf.text(line, 114.8, 223.4 + i * 4.9);
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