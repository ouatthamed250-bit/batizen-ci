/**
 * Design System BÂTIZEN.CI - Constantes UI réutilisables
 * Les couleurs pointent vers les variables CSS définies dans globals.css
 */

// Couleurs principales (références symboliques vers les CSS custom properties)
export const COLORS = {
  primary: "var(--primary)",       // #0B5FFF → Bleu principal
  secondary: "var(--btp-orange)",  // #FF7A00 → Orange
  navy: "var(--primary-dark)",     // #0D2B6B → Bleu foncé
  gradient: "bg-gradient-to-br from-white to-gray-50",
};

// Classes CSS réutilisables
export const UI = {
  // Cartes/Cards
  card: "bg-[var(--card)] rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-shadow duration-300",
  cardGradient: "bg-gradient-to-br from-[var(--card)] to-gray-50 rounded-2xl border border-gray-200 shadow-lg p-6",

  // Boutons
  btnPrimary: "w-full md:w-auto px-6 py-3 bg-[var(--btp-orange)] text-white font-bold rounded-xl hover:bg-[var(--btp-orange-dark)] active:scale-95 transition-all shadow-md shadow-orange-500/20",
  btnSecondary: "px-6 py-3 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-all",
  btnIcon: "flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold transition active:scale-95",

  // Formulaires
  input: "w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[var(--btp-orange)]/50 focus:border-[var(--btp-orange)] transition-all",
  select: "w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 focus:outline-none focus:ring-2 focus:ring-[var(--btp-orange)]/50 focus:border-[var(--btp-orange)] transition-all",
  textarea: "w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[var(--btp-orange)]/50 focus:border-[var(--btp-orange)] transition-all",

  // Typographie
  title: "text-xl md:text-2xl font-black text-[var(--navy)] mb-4 flex items-center gap-2",
  label: "text-sm font-semibold text-[var(--muted)] mb-1.5 block",
  text: "text-sm md:text-base text-[var(--text)] leading-relaxed",

  // Grilles
  gridCards: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6",
  gridPhotos: "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3",
  gridStats: "grid grid-cols-2 md:grid-cols-4 gap-4",

  // Containers
  pageContainer: "min-h-screen bg-[var(--background)] p-4 md:p-8",
  pageContainerAdmin: "min-h-screen bg-[var(--background-dark)] p-4 md:p-6",

  // Flex layouts
  flexHeader: "flex flex-col md:flex-row items-start md:items-center justify-between gap-4",
  flexCenter: "flex items-center justify-center gap-2",
};

// Badges de statut (utilisent les variables CSS pour les couleurs)
export const STATUS_BADGES = {
  success: "bg-[var(--success)]/10 text-[var(--success)] px-2 py-1 rounded-full text-xs font-bold",
  warning: "bg-[var(--warning)]/10 text-[var(--warning)] px-2 py-1 rounded-full text-xs font-bold",
  error: "bg-[var(--error)]/10 text-[var(--error)] px-2 py-1 rounded-full text-xs font-bold",
  info: "bg-[var(--primary)]/10 text-[var(--primary)] px-2 py-1 rounded-full text-xs font-bold",
  gray: "bg-[var(--muted)]/10 text-[var(--muted)] px-2 py-1 rounded-full text-xs font-bold",
};
