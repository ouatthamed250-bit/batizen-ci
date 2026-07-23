import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { Poppins } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { AuthProvider } from "@/contexts/AuthContext";
import LayoutWrapper from "@/components/layout/LayoutWrapper";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  display: "swap",
  variable: "--font-poppins",
});

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
    <html lang="fr" suppressHydrationWarning className={poppins.variable}>
      {/*
        Anti-flash / CLS : applique la classe 'dark' avant le rendu
        pour éviter le flash blanc → sombre au chargement.
      */}
      <head>
        <script dangerouslySetInnerHTML={{
          __html: `
            (function() {
              var theme = localStorage.getItem('theme');
              if (theme === 'dark' || (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                document.documentElement.classList.add('dark');
              }
            })();
          `,
        }} />
      </head>
      <body className="overflow-x-hidden antialiased" style={{ fontFamily: "'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
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