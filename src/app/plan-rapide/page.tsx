"use client";

import { useState, useRef } from "react";
import { ArrowLeft, Download } from "lucide-react";
import Link from "next/link";
import { TEMPLATES } from "@/lib/plan-templates";

/**
 * Nettoie une chaîne SVG de tout contenu dangereux (XSS).
 */
function sanitizeSvg(svg: string): string {
  return svg
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/\s+on\w+\s*=\s*(?:"[^"]*"|'[^']*')/gi, "")
    .replace(/\s+href\s*=\s*(?:"javascript:[^"]*"|'javascript:[^']*')/gi, ' href=""')
    .replace(/\s+xlink:href\s*=\s*(?:"javascript:[^"]*"|'javascript:[^']*')/gi, ' xlink:href=""')
    .replace(/<foreignObject\b[^>]*>[\s\S]*?<\/foreignObject>/gi, "");
}

export default function PlanRapidePage() {
  const [surface, setSurface] = useState(100);
  const [chambres, setChambres] = useState(3);
  const [sanitaires, setSanitaires] = useState(2);
  const [toiture, setToiture] = useState("tole_bac");
  const [etages, setEtages] = useState(1);
  const [svgString, setSvgString] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const svgRef = useRef<HTMLDivElement>(null);

  const toitLabel = toiture === "tole_bac" ? "Tôle bac" : toiture === "tuile" ? "Tuile" : "Terrasse étanche";

  const getTemplateKey = (): string => {
    if (etages <= 1) {
      if (chambres <= 1) return "studio_rdc";
      if (chambres <= 2) return "t2_rdc";
      if (chambres <= 3) return "t3_rdc";
      return "t4_rdc";
    } else if (etages === 2) {
      if (chambres <= 3) return "t3_r1";
      if (chambres <= 4) return "t4_r1";
      return "t5_r2";
    } else {
      if (chambres <= 4) return "t4_r2";
      return "t5_r2";
    }
  };

  const handleGenerer = async () => {
    setGenerating(true);
    try {
      const key = getTemplateKey();
      const templateFn = TEMPLATES[key];
      if (!templateFn) { alert("Aucun template disponible pour ces critères"); setGenerating(false); return; }
      const svg = templateFn(surface, toitLabel);
      setSvgString(svg);
    } catch {
      alert("Erreur lors de la génération du plan");
    } finally {
      setGenerating(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!svgRef.current) return;
    try {
      const html2canvas = (await import("html2canvas")).default;
      const jsPDF = (await import("jspdf")).default;
      const canvas = await html2canvas(svgRef.current, { scale: 2, useCORS: true });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("l", "mm", "a4");
      const pdfW = 297;
      const pdfH = 210;
      pdf.addImage(imgData, "PNG", 0, 0, pdfW, pdfH);
      const dateStr = new Date().toISOString().split("T")[0];
      pdf.save(`plan-batizen-${getTemplateKey()}-${dateStr}.pdf`);
    } catch {
      alert("Erreur lors de la génération du PDF");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0D2B6B] via-[#0D2B6B] to-[#1e3a8a] text-white">
      <div className="mx-auto max-w-5xl px-4 py-8 space-y-8">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link href="/simulation" className="grid size-10 place-items-center rounded-full bg-white/15 hover:bg-white/25 transition">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-2xl font-black">🏗️ Plan rapide</h1>
            <p className="text-sm text-white/70">Générez un plan architectural standardisé en 5 questions</p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Formulaire */}
          <div className="rounded-[28px] border border-white/30 bg-white/20 backdrop-blur-xl p-6 shadow-xl space-y-5">
            <h2 className="font-black text-lg">📝 Questionnaire</h2>

            <div>
              <label className="mb-1 block text-sm font-bold text-white/70">1. Surface totale (m²)</label>
              <input type="number" value={surface} onChange={e => setSurface(Number(e.target.value))} min={15} max={500}
                className="h-[54px] w-full rounded-[18px] bg-white/10 border border-white/20 px-4 text-sm font-bold text-white outline-none" />
            </div>

            <div>
              <label className="mb-1 block text-sm font-bold text-white/70">2. Nombre de chambres</label>
              <select value={chambres} onChange={e => setChambres(Number(e.target.value))}
                className="h-[54px] w-full rounded-[18px] bg-white/10 border border-white/20 px-4 text-sm font-bold text-white outline-none">
                {[1,2,3,4,5].map(n => <option key={n} value={n}>{n} chambre{n > 1 ? "s" : ""}</option>)}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-bold text-white/70">3. Nombre de sanitaires</label>
              <select value={sanitaires} onChange={e => setSanitaires(Number(e.target.value))}
                className="h-[54px] w-full rounded-[18px] bg-white/10 border border-white/20 px-4 text-sm font-bold text-white outline-none">
                {[1,2,3].map(n => <option key={n} value={n}>{n} salle{n > 1 ? "s" : ""} de bain</option>)}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-bold text-white/70">4. Type de toiture</label>
              <select value={toiture} onChange={e => setToiture(e.target.value)}
                className="h-[54px] w-full rounded-[18px] bg-white/10 border border-white/20 px-4 text-sm font-bold text-white outline-none">
                <option value="tole_bac">Tôle bac</option>
                <option value="tuile">Tuile</option>
                <option value="terrasse">Terrasse étanche</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-bold text-white/70">5. Nombre d'étages</label>
              <select value={etages} onChange={e => setEtages(Number(e.target.value))}
                className="h-[54px] w-full rounded-[18px] bg-white/10 border border-white/20 px-4 text-sm font-bold text-white outline-none">
                <option value={1}>RDC</option>
                <option value={2}>R+1</option>
                <option value={3}>R+2</option>
              </select>
            </div>

            <button onClick={handleGenerer} disabled={generating}
              className="w-full h-[56px] rounded-[18px] bg-gradient-to-r from-[#FF7A00] to-[#FF8C00] font-black text-white shadow-lg disabled:opacity-50 text-lg">
              {generating ? "⏳ Génération..." : "🏗️ Générer le plan"}
            </button>
          </div>

          {/* Résultat SVG */}
          <div className="space-y-4">
            {!svgString ? (
              <div className="rounded-[28px] border-2 border-dashed border-white/30 bg-white/10 backdrop-blur-xl p-12 text-center flex flex-col items-center justify-center h-full">
                <span className="text-6xl mb-4">📐</span>
                <p className="text-white/60 font-bold">Remplissez le questionnaire<br/>et cliquez sur "Générer"</p>
                <p className="text-white/40 text-sm mt-2">Plan indicatif — Pour un plan d'exécution, contactez un architecte agréé</p>
              </div>
            ) : (
              <>
                <div ref={svgRef} className="rounded-[28px] overflow-hidden border border-white/30 bg-white shadow-xl"
                  dangerouslySetInnerHTML={{ __html: sanitizeSvg(svgString) }}
                  />
                <button onClick={handleDownloadPDF}
                  className="w-full h-[56px] rounded-[18px] bg-gradient-to-r from-green-500 to-green-600 font-black text-white shadow-lg flex items-center justify-center gap-2 text-lg">
                  <Download size={22} /> Télécharger PDF
                </button>
                <p className="text-[10px] text-white/40 text-center">Plan indicatif — Pour un plan d'exécution, contactez un architecte agréé</p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}