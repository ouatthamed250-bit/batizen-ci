import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { AuthProvider } from "@/contexts/AuthContext";
import LayoutWrapper from "@/components/layout/LayoutWrapper";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { QueryProvider } from "@/components/QueryProvider";
import { ServiceWorkerRegister } from "@/components/ServiceWorkerRegister";

export const metadata: Metadata = {
  title: "BÂTIZEN CI — Construire en confiance",
  description: "Application premium de simulation, devis, suivi chantier et gestion de projets immobiliers en Côte d'Ivoire.",
  applicationName: "BÂTIZEN CI",
  manifest: "/manifest.json",
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
    <html lang="fr" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#0D2B6B" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      </head>
      <body className="overflow-x-hidden antialiased">
        <AuthProvider>
          <ThemeProvider>
            <QueryProvider>
              <LayoutWrapper>
                <ErrorBoundary>
                  {children}
                </ErrorBoundary>
              </LayoutWrapper>
            </QueryProvider>
          </ThemeProvider>
        </AuthProvider>
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
