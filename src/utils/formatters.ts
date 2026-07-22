// src/utils/formatters.ts
import type { Localisation } from "@/types/chantier";

/**
 * Formate un montant en Francs CFA (XOF)
 */
export function formatFcfa(value: number | undefined | null): string {
  if (value === undefined || value === null) return "0 FCFA";
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "XOF",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value).replace("XOF", "FCFA");
}

/**
 * Formate une date en format court français (ex: "12 janv. 2024")
 */
export function formatDateCourte(dateStr: string | number | undefined | null): string {
  if (!dateStr) return "Non définie";
  const date = new Date(dateStr);
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

/**
 * Formate une localisation de manière lisible (ex: "Cocody, Abidjan")
 */
export function formatLocalisation(loc: Localisation | undefined | null): string {
  if (!loc) return "Non spécifié";
  const parts = [loc.quartier, loc.commune, loc.ville].filter(Boolean);
  return parts.length > 0 ? parts.join(", ") : "Non spécifié";
}

/**
 * Traduit le statut d'un chantier en label lisible
 */
export function getStatutLabel(statut: string | undefined): string {
  const labels: Record<string, string> = {
    en_attente: "En attente",
    en_cours: "En cours",
    termine: "Terminé",
    suspendu: "Suspendu",
  };
  return labels[statut || ""] || statut || "Inconnu";
}