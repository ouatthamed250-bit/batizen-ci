import jsPDF from "jspdf";
import { montantEnLettresFcfa } from "@/lib/nombreEnLettres";

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
    villa: { x: 114.8, y: 96.1 },
    maison: { x: 114.8, y: 96.1 },
    duplex: { x: 134.3, y: 96.1 },
    immeuble: { x: 154.8, y: 96.1 },
    commerce: { x: 176.0, y: 96.1 },
    entrepot: { x: 114.8, y: 102.5 },
    renovation: { x: 134.3, y: 102.5 },
    autre: { x: 134.3, y: 102.5 },
  };
  return positions[t] || null;
}

export async function generateReceiptPDF(data: ReceiptData): Promise<void> {
  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const img = await loadTemplateImage("/templates/recu-template.jpg");
  pdf.addImage(img, "JPEG", 0, 0, 210, 297);

  pdf.setFont("helvetica", "bold");
  pdf.setTextColor(13, 43, 107);
  pdf.setFontSize(10);

  pdf.text(data.receiptNumber.replace(/^RCV-/, ""), 157.9, 48.7);
  pdf.text(data.date, 13.9, 68.5);
  pdf.text(data.paymentMethod, 73.8, 68.5);
  if (data.projectName) pdf.text(data.projectName, 152.8, 63.4);
  pdf.text(data.clientName, 41.0, 89.5);
  if (data.clientContact) pdf.text(data.clientContact, 33.8, 96.3);
  if (data.clientEmail) pdf.text(data.clientEmail, 33.8, 103.1);
  if (data.clientAdresse) pdf.text(data.clientAdresse, 33.8, 109.8);
  if (data.clientVille) pdf.text(data.clientVille, 33.8, 116.6);
  if (data.chantierLieu) pdf.text(data.chantierLieu, 143.6, 89.5);

  const checkPos = typeCheckboxPosition(data.chantierType);
  if (checkPos) {
    pdf.setFontSize(9);
    pdf.text("X", checkPos.x, checkPos.y);
  }

  const rowsY: Record<string, number> = {
    acompte: 141.1,
    gros_oeuvre: 145.4,
    second_oeuvre: 149.7,
    finitions: 153.9,
    autre: 158.2,
  };
  const checkedRows = new Set<string>();
  data.items.forEach((item) => {
    const row = matchDesignationRow(item.description);
    checkedRows.add(row);
    pdf.setFontSize(9);
    pdf.text(fmtFcfa(item.total), 140, rowsY[row], { align: "right" });
    if (row === "autre") {
      pdf.setFontSize(8);
      pdf.text(item.description.slice(0, 28), 92, rowsY.autre);
    }
  });
  pdf.setFontSize(11);
  checkedRows.forEach((row) => {
    pdf.text("X", 45.5, rowsY[row]);
  });

  pdf.setFontSize(10);
  pdf.text(fmtFcfa(data.totalAmount), 168, 169.2, { align: "right" });

  const lettres = montantEnLettresFcfa(data.totalAmount);
  pdf.setFontSize(8.5);
  const lettresLines = pdf.splitTextToSize(lettres, 175);
  pdf.text(lettresLines[0] || "", 46.1, 184.7);
  if (lettresLines[1]) pdf.text(lettresLines[1], 13.3, 190.1);

  pdf.setFontSize(10);
  pdf.text(data.agentName, 42.0, 204.4);

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