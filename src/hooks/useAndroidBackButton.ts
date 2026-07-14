"use client";

import { useEffect, useRef, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";

const EXIT_DELAY = 2000; // 2 secondes
const HOME_PATHS = ["/dashboard", "/"];

interface UseAndroidBackButtonOptions {
  onExit?: () => void;
  toastMessage?: string;
  showToast?: boolean;
}

export function useAndroidBackButton({
  onExit,
  toastMessage = "Appuyez à nouveau pour quitter",
  showToast = true,
}: UseAndroidBackButtonOptions = {}) {
  const router = useRouter();
  const pathname = usePathname();
  const exitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const showToastRef = useRef(false);

  const isHomePage = useCallback(() => {
    return HOME_PATHS.includes(pathname);
  }, [pathname]);

  const clearExitTimer = useCallback(() => {
    if (exitTimerRef.current) {
      clearTimeout(exitTimerRef.current);
      exitTimerRef.current = null;
    }
  }, []);

  const showExitToast = useCallback(() => {
    if (!showToast) return;
    
    // Créer un toast personnalisé
    const toast = document.createElement("div");
    toast.className = "android-exit-toast";
    toast.textContent = toastMessage;
    toast.style.cssText = `
      position: fixed;
      bottom: 80px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(0, 0, 0, 0.8);
      color: white;
      padding: 12px 24px;
      border-radius: 24px;
      font-size: 14px;
      font-weight: 500;
      z-index: 99999;
      animation: toastFadeIn 0.3s ease;
      pointer-events: none;
      text-align: center;
      max-width: 90%;
    `;

    // Ajouter le style d'animation
    if (!document.getElementById("android-toast-style")) {
      const style = document.createElement("style");
      style.id = "android-toast-style";
      style.textContent = `
        @keyframes toastFadeIn {
          from { opacity: 0; transform: translateX(-50%) translateY(20px); }
          to { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
        @keyframes toastFadeOut {
          from { opacity: 1; }
          to { opacity: 0; }
        }
      `;
      document.head.appendChild(style);
    }

    document.body.appendChild(toast);

    // Supprimer le toast après 2 secondes
    setTimeout(() => {
      toast.style.animation = "toastFadeOut 0.3s ease forwards";
      setTimeout(() => {
        toast.remove();
      }, 300);
    }, EXIT_DELAY);
  }, [toastMessage, showToast]);

  const handleBackButton = useCallback(() => {
    if (isHomePage()) {
      // Si on est sur la page d'accueil
      if (exitTimerRef.current) {
        // 2ème appui : quitter l'application
        clearExitTimer();
        
        if (onExit) {
          onExit();
        } else {
          // Comportement par défaut : essayer de fermer l'application
          const nav = window.navigator as Navigator & { app?: { exitApp: () => void } };
          if (nav.app && typeof nav.app.exitApp === "function") {
            // Application Capacitor/Cordova
            nav.app.exitApp();
          } else {
            // Navigateur web : afficher un message et essayer de fermer
            showExitToast();
            // Tenter de fermer (peut être bloqué par le navigateur)
            window.close();
            // Fallback : rediriger vers une page blanche
            setTimeout(() => {
              window.location.href = "about:blank";
            }, 100);
          }
        }
      } else {
        // 1er appui : afficher le toast et démarrer le timer
        showExitToast();
        exitTimerRef.current = setTimeout(() => {
          clearExitTimer();
        }, EXIT_DELAY);
      }
    } else {
      // Navigation normale : retour à la page précédente
      router.back();
    }
  }, [isHomePage, router, clearExitTimer, showExitToast, onExit]);

  useEffect(() => {
    // Ajouter l'écouteur pour le bouton retour
    window.addEventListener("popstate", handleBackButton);

    // Pour les applications mobiles (Capacitor/Cordova)
    const handleAndroidBack = (e: Event) => {
      e.preventDefault();
      handleBackButton();
    };

    document.addEventListener("backbutton", handleAndroidBack, false);

    // Nettoyer
    return () => {
      window.removeEventListener("popstate", handleBackButton);
      document.removeEventListener("backbutton", handleAndroidBack);
      clearExitTimer();
    };
  }, [handleBackButton, clearExitTimer]);

  // Nettoyer le timer quand le composant est démonté
  useEffect(() => {
    return () => {
      clearExitTimer();
    };
  }, [clearExitTimer]);
}

// Hook simplifié pour une utilisation rapide
export function useSimpleAndroidBack(onExit?: () => void) {
  return useAndroidBackButton({
    onExit,
    toastMessage: "Appuyez à nouveau pour quitter",
    showToast: true,
  });
}