"use client";

type BreakingNewsTickerProps = {
  compact?: boolean;
};

const alerts = [
  "En Côte d’Ivoire, des clients perdent leur argent après des avances sans contrôle réel du chantier.",
  "Des ouvriers disparaissent parfois après acompte, laissant les familles sans solution ni recours rapide.",
  "Mauvaise qualité, finitions bâclées, matériaux remplacés sans accord : le chantier devient un risque.",
  "Argent décaisser sans suivi quotidien, sans preuve photo, sans vérification et sans validation client.",
  "Retards injustifiés, absence de reporting, dépenses gonflées et travaux non conformes fragilisent le projet.",
  "Avec BÂTIZEN CI, vos ouvriers travaillent sous engagement, chaque étape est vérifiée avant paiement.",
  "Votre argent ne sort que quand la qualité est contrôlée : preuve terrain, suivi clair, résultat conforme.",
  "J’ai donné 18 millions à des ouvriers à Abidjan. Ils ont disparu après les fondations. Ma famille pleure encore.",
  "Ma maison à Yamoussoukro est restée à moitié finie pendant 3 ans. Plus d’argent, plus de nouvelles.",
  "On m’a promis du carrelage premium. J’ai reçu du bas de gamme. J’ai payé deux fois pour rien.",
  "L’ouvrier a pris l’acompte pour ma villa à Cocody et n’est jamais revenu. J’ai tout perdu.",
  "Pas de photos, pas de rapport, pas de suivi. J’ai payé pendant 9 mois sans savoir où en était mon chantier.",
  "Les matériaux ont été changés sans mon accord. J’ai découvert la supercherie après la réception.",
  "Mon budget a doublé à cause des surfacturations. Personne ne m’a protégé. Jusqu’à ce que je trouve BÂTIZEN CI.",
  "Les ouvriers sont partis en laissant des fissures partout. J’ai dû tout recommencer. Plus jamais ça.",
  "Chez BÂTIZEN CI, chaque ouvrier est engagé. Chaque franc est contrôlé. Vous ne payez que quand c’est bien fait.",
  "J’ai donné 25 millions à des ouvriers à San Pedro. Après les fondations, plus personne. Ma maison est restée ouverte à la pluie.",
  "À Abidjan Plateau, on m’a promis une maison en 6 mois. 14 mois plus tard, j’ai tout perdu et je dors encore chez ma sœur.",
  "L’ouvrier m’a dit que le carrelage était premium. C’était du rebut. J’ai payé 3 fois le prix pour refaire tout le sol.",
  "Mon mari a avancé l’argent pour notre villa à Bingerville. L’équipe a disparu. Aujourd’hui je suis seule avec des dettes et un terrain vide.",
];

export function BreakingNewsTicker({ compact = false }: BreakingNewsTickerProps) {
  const items = [...alerts, ...alerts];

  return (
    <section className={`overflow-hidden rounded-[24px] border border-[#DCE8FF] bg-[linear-gradient(135deg,#081D4A,#0D2B6B)] text-white shadow-[0_18px_40px_rgba(13,43,107,0.22)] ${compact ? "py-3" : "py-4"}`}>
      <div className="flex items-center gap-3 px-4 pb-3">
        <span className="rounded-full bg-[#FF7A00] px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-white shadow-[0_10px_24px_rgba(255,122,0,0.35)]">Alerte chantier</span>
        <p className="text-[11px] font-bold text-white/80">Analyse BÂTIZEN CI — Protection client & contrôle qualité</p>
      </div>
      <div className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-10 bg-gradient-to-r from-[#0D2B6B] to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-10 bg-gradient-to-l from-[#0D2B6B] to-transparent" />
        <div className="marquee-track gap-8 px-4">
          {items.map((item, index) => (
            <div className="flex items-center gap-3 whitespace-nowrap" key={`${item}-${index}`}>
              <span className="size-2 rounded-full bg-[#FF7A00] shadow-[0_0_16px_rgba(255,122,0,0.45)]" />
              <span className={`font-semibold text-white/95 ${compact ? "text-[11px]" : "text-xs"}`}>{item}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="mt-3 border-t border-white/10 px-4 pt-3">
        <p className={`text-white/78 ${compact ? "text-[10px]" : "text-[11px]"}`}>
          Chez <span className="font-black text-[#FFB15E]">BÂTIZEN CI</span>, vos inquiétudes sont levées : les équipes sont engagées, suivies, contrôlées et payées seulement après vérification du travail exécuté.
        </p>
      </div>
    </section>
  );
}
