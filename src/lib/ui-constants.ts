/**
 * Design System BÂTIZEN.CI - Constantes UI réutilisables
 */

// Couleurs principales
export const COLORS = {
  primary: "#1e3a8a", // Bleu marine
  secondary: "#FF7A00", // Orange
  navy: "#0D2B6B", // Navy plus sombre pour les titres
  gradient: "bg-gradient-to-br from-white to-gray-50",
};

// Classes CSS réutilisables
export const UI = {
  // Cartes/Cards
  card: "bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-shadow duration-300",
  cardGradient: "bg-gradient-to-br from-white to-gray-50 rounded-2xl border border-gray-200 shadow-lg p-6",

  // Boutons
  btnPrimary: "w-full md:w-auto px-6 py-3 bg-[#FF7A00] text-white font-bold rounded-xl hover:bg-[#e66e00] active:scale-95 transition-all shadow-md shadow-orange-500/20",
  btnSecondary: "px-6 py-3 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-all",
  btnIcon: "flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold transition active:scale-95",

  // Formulaires
  input: "w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#FF7A00]/50 focus:border-[#FF7A00] transition-all",
  select: "w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#FF7A00]/50 focus:border-[#FF7A00] transition-all",
  textarea: "w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#FF7A00]/50 focus:border-[#FF7A00] transition-all",

  // Typographie
  title: "text-xl md:text-2xl font-black text-[#1e3a8a] mb-4 flex items-center gap-2",
  label: "text-sm font-semibold text-gray-600 mb-1.5 block",
  text: "text-sm md:text-base text-gray-700 leading-relaxed",

  // Grilles
  gridCards: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6",
  gridPhotos: "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3",
  gridStats: "grid grid-cols-2 md:grid-cols-4 gap-4",

  // Containers
  pageContainer: "min-h-screen bg-gray-50 p-4 md:p-8",
  pageContainerAdmin: "min-h-screen bg-[#111827] p-4 md:p-6",

  // Flex layouts
  flexHeader: "flex flex-col md:flex-row items-start md:items-center justify-between gap-4",
  flexCenter: "flex items-center justify-center gap-2",
};

// Badges de statut
export const STATUS_BADGES = {
  success: "bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-bold",
  warning: "bg-orange-100 text-orange-700 px-2 py-1 rounded-full text-xs font-bold",
  error: "bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs font-bold",
  info: "bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs font-bold",
  gray: "bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs font-bold",
};