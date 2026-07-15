import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { AuthProvider } from "@/contexts/AuthContext";
import LayoutWrapper from "@/components/layout/LayoutWrapper";

export const metadata: Metadata = {
  title: "BÂTIZEN CI — Construire en confiance",
  description: "Application premium de simulation, devis, suivi chantier et gestion de projets immobiliers en Côte d'Ivoire.",
  applicationName: "BÂTIZEN CI",
  manifest: "/manifest.webmanifest",
  keywords: ["construction", "BTP", "Côte d'Ivoire", "Abidjan", "simulation", "devis", "chantier"],
  authors: [{ name: "BÂTIZEN CI" }],
  icons: {
    icon: "/favicon.png",
    shortcut: "/favicon.png",
    apple: "/assets/images/logo.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#0B5FFF",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fr">
      <body className="overflow-x-hidden">
        <AuthProvider>
          <ThemeProvider>
            <LayoutWrapper>
              {children}
            </LayoutWrapper>
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
