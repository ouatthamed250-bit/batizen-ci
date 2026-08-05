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

function matchDesignationRow(description: string): "acompte" | "gros_oeuvre" | "second_oeuvre" | "finitions" | "autre" {
  const d = description.toLowerCase();
  if (d.includes("acompte") || d.includes("premier") || d.includes("dépôt") || d.includes("depot")) return "acompte";
  if (d.includes("gros")) return "gros_oeuvre";
  if (d.includes("second")) return "second_oeuvre";
  if (d.includes("finition")) return "finitions";
  return "autre";
}

export async function generateReceiptPDF(data: ReceiptData): Promise<void> {
  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const img = await loadTemplateImage("/templates/recu-template.png");
  pdf.addImage(img, "PNG", 0, 0, 210, 297);

  pdf.setFont("helvetica", "bold");
  pdf.setTextColor(13, 43, 107);
  pdf.setFontSize(10);

  pdf.text(data.receiptNumber, 157.9, 48.7);
  pdf.text(data.date, 13.9, 68.5);
  pdf.text(data.paymentMethod, 73.8, 68.5);
  if (data.projectName) pdf.text(data.projectName, 152.8, 63.4);
  pdf.text(data.clientName, 41.0, 89.5);
  if (data.clientContact) pdf.text(data.clientContact, 35.9, 96.3);

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
    pdf.text(`${item.total.toLocaleString("fr-FR")}`, 114.8, rowsY[row]);
    if (row === "autre") {
      pdf.setFontSize(8);
      pdf.text(item.description, 92, rowsY.autre);
    }
  });
  pdf.setFontSize(11);
  checkedRows.forEach((row) => {
    pdf.text("X", 45.5, rowsY[row]);
  });

  pdf.setFontSize(11);
  pdf.text(`${data.totalAmount.toLocaleString("fr-FR")}`, 114.8, 169.2);

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