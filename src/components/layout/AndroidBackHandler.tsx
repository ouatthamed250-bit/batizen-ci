"use client";

import { useAndroidBackButton } from "@/hooks/useAndroidBackButton";

export function AndroidBackHandler() {
  // Initialiser le gestionnaire du bouton retour Android
  useAndroidBackButton({
    toastMessage: "Appuyez à nouveau pour quitter",
    showToast: true,
  });

  return null; // Ce composant n'affiche rien, il gère juste la logique
}