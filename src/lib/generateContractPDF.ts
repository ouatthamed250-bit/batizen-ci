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

function blankArea(pdf: any, x: number, y: number, w: number, h: number) {
  pdf.setFillColor(255, 255, 255);
  pdf.rect(x, y - h + 1, w, h, "F");
}

const TYPE_POS: Record<string, { x: number; y: number }> = {
  villa: { x: 114.8, y: 82.6 },
  maison: { x: 114.8, y: 82.6 },
  duplex: { x: 134.3, y: 82.6 },
  immeuble: { x: 154.8, y: 82.6 },
  commerce: { x: 176.0, y: 82.6 },
  entrepot: { x: 114.8, y: 89.0 },
  renovation: { x: 134.3, y: 89.0 },
  autre: { x: 134.3, y: 89.0 },
};

const PRESTATION_POS: Record<string, { x: number; y: number }> = {
  etude: { x: 116.5, y: 115.4 },
  plans: { x: 116.5, y: 119.9 },
  devis: { x: 116.5, y: 124.2 },
  gros_oeuvre: { x: 116.5, y: 128.2 },
  second_oeuvre: { x: 116.5, y: 132.5 },
  finitions: { x: 156.3, y: 115.4 },
  suivi: { x: 156.3, y: 119.9 },
  livraison: { x: 156.3, y: 124.2 },
  assistance: { x: 156.3, y: 128.2 },
  autre: { x: 156.3, y: 132.5 },
};

export async function generateContractPDF(data: ContractData): Promise<Blob> {
  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const img = await loadTemplateImage("/templates/contract-template.jpg");
  pdf.addImage(img, "JPEG", 0, 0, 210, 297);

  pdf.setFont("helvetica", "bold");
  pdf.setTextColor(13, 43, 107);
  pdf.setFontSize(10);

  pdf.text(data.contractNumber, 60.5, 56.1);
  blankArea(pdf, 152, 51, 45, 6);
  pdf.text(data.contractDate, 152.8, 56.1);

  pdf.text(data.clientName, 41.0, 75.4);
  if (data.clientPhone) pdf.text(data.clientPhone, 36.9, 81.2);
  if (data.clientEmail) pdf.text(data.clientEmail, 29.7, 87.0);
  if (data.clientAdresse) pdf.text(data.clientAdresse, 32.8, 92.8);
  if (data.clientVille) pdf.text(data.clientVille, 26.7, 97.7);

  if (data.chantierLieu) pdf.text(data.chantierLieu, 143.6, 75.4);
  const typePos = TYPE_POS[(data.chantierType || "").toLowerCase()];
  if (typePos) { pdf.setFontSize(9); pdf.text("X", typePos.x, typePos.y); pdf.setFontSize(10); }
  if (data.surfaceEstimee) pdf.text(String(data.surfaceEstimee), 153.8, 96.1);

  pdf.setFontSize(8.5);
  const descLines = pdf.splitTextToSize(data.descriptionTravaux || "", 110);
  descLines.slice(0, 5).forEach((line: string, i: number) => {
    pdf.text(line, 13.3, 115.4 + i * 3.9);
  });

  pdf.setFontSize(9);
  data.prestations.forEach((key) => {
    const pos = PRESTATION_POS[key];
    if (pos) pdf.text("X", pos.x, pos.y);
  });
  if (data.prestations.includes("autre") && data.prestationAutre) {
    pdf.setFontSize(7.5);
    pdf.text(data.prestationAutre.slice(0, 20), 164.1, 132.5);
  }

  pdf.setFontSize(10);
  blankArea(pdf, 39, 148, 55, 6);
  pdf.text(fmtDateFr(data.dateDebut), 40.0, 152.2);
  blankArea(pdf, 38, 153, 55, 6);
  pdf.text(fmtDateFr(data.dateFin), 39.0, 157.0);
  pdf.text(data.dureeEstimee, 41.0, 161.9);

  pdf.text(fmtFcfa(data.montantTotal), 178, 152.2, { align: "right" });
  pdf.setFontSize(9);
  pdf.text(String(data.acomptePourcent), 126.1, 157.0);
  pdf.setFontSize(10);
  const montantAcompte = Math.round((data.montantTotal * data.acomptePourcent) / 100);
  pdf.text(fmtFcfa(montantAcompte), 178, 157.0, { align: "right" });
  pdf.text(fmtFcfa(data.montantTotal - montantAcompte), 178, 161.9, { align: "right" });

  pdf.setFontSize(8);
  const echRows = [203.0, 207.3, 211.6, 215.9];
  data.echeancier.slice(0, 4).forEach((row, i) => {
    pdf.text(row.description.slice(0, 18), 20.5, echRows[i]);
    pdf.text(fmtDateFr(row.date), 69.7, echRows[i]);
    pdf.text(fmtFcfa(row.montant), 113, echRows[i], { align: "right" });
  });

  if (data.notes) {
    pdf.setFontSize(8.5);
    const notesLines = pdf.splitTextToSize(data.notes, 175);
    notesLines.slice(0, 2).forEach((line: string, i: number) => {
      pdf.text(line, 13.3, 225.0 + i * 3.8);
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