const UNITS = ["zéro","un","deux","trois","quatre","cinq","six","sept","huit","neuf","dix","onze","douze","treize","quatorze","quinze","seize","dix-sept","dix-huit","dix-neuf"];
const TENS = ["","","vingt","trente","quarante","cinquante","soixante","","quatre-vingt",""];

function twoDigitsToWords(n: number, isLastGroup: boolean): string {
  if (n < 20) return UNITS[n];
  const t = Math.floor(n / 10);
  const u = n % 10;
  if (t === 7 || t === 9) {
    const baseIndex = t - 1;
    if (u === 1 && t === 7) return TENS[baseIndex] + " et onze";
    return TENS[baseIndex] + "-" + UNITS[10 + u];
  }
  if (u === 0) return t === 8 ? (isLastGroup ? "quatre-vingts" : "quatre-vingt") : TENS[t];
  if (u === 1 && t !== 8) return TENS[t] + " et un";
  return TENS[t] + "-" + UNITS[u];
}

function threeDigitsToWords(n: number, isLastGroup: boolean): string {
  if (n === 0) return "";
  const c = Math.floor(n / 100);
  const rest = n % 100;
  const parts: string[] = [];
  if (c > 0) {
    let centWord = c === 1 ? "cent" : UNITS[c] + " cent";
    if (c > 1 && rest === 0 && isLastGroup) centWord += "s";
    parts.push(centWord);
  }
  if (rest > 0) parts.push(twoDigitsToWords(rest, isLastGroup));
  return parts.join(" ");
}

export function nombreEnLettres(n: number): string {
  const num = Math.round(Math.abs(n));
  if (num === 0) return "zéro";

  const milliards = Math.floor(num / 1_000_000_000);
  const millions = Math.floor((num % 1_000_000_000) / 1_000_000);
  const milliers = Math.floor((num % 1_000_000) / 1_000);
  const unites = num % 1_000;

  const segments: string[] = [];
  if (milliards > 0) segments.push(threeDigitsToWords(milliards, false) + (milliards > 1 ? " milliards" : " milliard"));
  if (millions > 0) segments.push(threeDigitsToWords(millions, false) + (millions > 1 ? " millions" : " million"));
  if (milliers > 0) segments.push(milliers === 1 ? "mille" : threeDigitsToWords(milliers, false) + " mille");
  if (unites > 0 || segments.length === 0) segments.push(threeDigitsToWords(unites, true));

  return segments.join(" ").replace(/\s+/g, " ").trim();
}

export function montantEnLettresFcfa(n: number): string {
  const words = nombreEnLettres(n);
  const capitalized = words.charAt(0).toUpperCase() + words.slice(1);
  return `${capitalized} francs CFA`;
}