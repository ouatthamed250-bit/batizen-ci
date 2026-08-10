import jsPDF from "jspdf";

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
  clientEmail?: string;
  clientAdresse?: string;
  clientVille?: string;
  chantierLieu?: string;
  chantierType?: string;
  items: ReceiptItem[];
  totalAmount: number;
  paymentMethod: string;
  projectName?: string;
  agentName: string;
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

function matchDesignationRow(description: string): "acompte" | "gros_oeuvre" | "second_oeuvre" | "finitions" | "autre" {
  const d = description.toLowerCase();
  if (d.includes("acompte") || d.includes("premier") || d.includes("dépôt") || d.includes("depot")) return "acompte";
  if (d.includes("gros")) return "gros_oeuvre";
  if (d.includes("second")) return "second_oeuvre";
  if (d.includes("finition")) return "finitions";
  return "autre";
}

function typeCheckboxPosition(type?: string): { x: number; y: number } | null {
  const t = (type || "").toLowerCase();
  const positions: Record<string, { x: number; y: number }> = {
    villa: { x: 99.5, y: 85.5 },
    maison: { x: 99.5, y: 85.5 },
    duplex: { x: 99.5, y: 92.3 },
    immeuble: { x: 99.5, y: 99.2 },
    commerce: { x: 133.3, y: 85.5 },
    entrepot: { x: 133.3, y: 92.3 },
    renovation: { x: 133.3, y: 99.2 },
    autre: { x: 133.3, y: 99.2 },
  };
  return positions[t] || null;
}

const ROWS_Y: Record<string, number> = {
  acompte: 154.8,
  gros_oeuvre: 165.0,
  second_oeuvre: 177.7,
  finitions: 190.0,
  autre: 200.5,
};

export async function generateReceiptPDF(data: ReceiptData): Promise<void> {
  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const img = await loadTemplateImage("/templates/recu-template.jpg");
  pdf.addImage(img, "JPEG", 0, 0, 210, 297);

  pdf.setFont("helvetica", "bold");
  pdf.setTextColor(13, 43, 107);
  pdf.setFontSize(10);

  pdf.text(data.receiptNumber.replace(/^RCV-/, ""), 143.6, 7.8);
  pdf.text(data.date, 143.6, 14.4);
  pdf.text(data.paymentMethod, 143.6, 21.0);
  if (data.projectName) pdf.text(data.projectName, 143.6, 27.5);
  pdf.text(data.receiptNumber.replace(/^RCV-/, ""), 143.6, 34.1);

  pdf.text(data.clientName, 31.8, 66.0);
  if (data.clientContact) pdf.text(data.clientContact, 28.7, 78.7);
  if (data.clientEmail) pdf.text(data.clientEmail, 28.7, 85.5);
  if (data.clientAdresse) pdf.text(data.clientAdresse, 31.8, 92.3);
  if (data.clientVille) pdf.text(data.clientVille, 28.7, 99.2);
  if (data.chantierLieu) pdf.text(data.chantierLieu, 113.8, 66.0);

  const checkPos = typeCheckboxPosition(data.chantierType);
  if (checkPos) {
    pdf.setFontSize(9);
    pdf.text("X", checkPos.x, checkPos.y);
  }

  pdf.setFontSize(9);
  const checkedRows = new Set<string>();
  data.items.forEach((item) => {
    const row = matchDesignationRow(item.description);
    checkedRows.add(row);
    pdf.text(fmtFcfa(item.total), 100.0, ROWS_Y[row], { align: "right" });
    if (row === "autre") {
      pdf.setFontSize(8);
      pdf.text(item.description.slice(0, 24), 48.0, ROWS_Y.autre);
      pdf.setFontSize(9);
    }
  });
  pdf.setFontSize(10);
  checkedRows.forEach((row) => {
    pdf.text("X", 65.5, ROWS_Y[row]);
  });

  pdf.setFontSize(10);
  pdf.text(fmtFcfa(data.totalAmount), 173.3, 153.8, { align: "right" });

  pdf.setFontSize(10);
  pdf.text(data.agentName, 20.5, 231.2);

  pdf.save(`Recu_${data.receiptNumber}_${data.clientName.replace(/\s+/g, "_")}.pdf`);
}

export function generateReceiptNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `RCV-${timestamp}-${random}`;
}

export function formatDate(date: Date = new Date()): string {
  return date.toLocaleDateString("fr-FR", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
}

export function formatTime(date: Date = new Date()): string {
  return date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}