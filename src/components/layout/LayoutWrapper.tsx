"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuthContext } from "@/contexts/AuthContext";
import { Header } from "./Header";
import { BottomNav } from "./BottomNav";
import Sidebar from "./Sidebar";
import ChatBot from "../ChatBot";
import { AndroidBackHandler } from "./AndroidBackHandler";
import { BreakingNewsTicker } from "../ui/BreakingNewsTicker";
import { InfoTicker } from "../ui/InfoTicker";

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading } = useAuthContext();

  const publicPages = ["/", "/login", "/register", "/forgot-password"];
  const isPublicPage = publicPages.includes(pathname);
  // Les pages /admin utilisent leur propre layout (admin layout) : on n'affiche
  // PAS le chrome client (Header/Sidebar/BottomNav) dessus.
  const isAdminPage = pathname.startsWith("/admin");
  const showLayout = !isPublicPage && !isAdminPage && !!user;

  // Redirige selon le rôle de l'utilisateur
  useEffect(() => {
    if (!loading && user) {
      // Admin sur une page client → dashboard admin dédié
      if (
        user.role === "admin" &&
        (pathname === "/dashboard" ||
          pathname === "/projets" ||
          pathname === "/simulation")
      ) {
        router.replace("/admin");
      }
      // Client qui tente d'accéder à /admin → dashboard client
      if (user.role !== "admin" && pathname === "/admin") {
        router.replace("/dashboard");
      }
    }
  }, [user, loading, pathname, router]);

  return (
    <>
      {showLayout && <Header />}
      {showLayout && <BreakingNewsTicker />}
      {showLayout && <InfoTicker />}
      <AndroidBackHandler />
      {showLayout && <Sidebar />}
      {children}
      {showLayout && <BottomNav />}
      {showLayout && <ChatBot />}
    </>
  );
}
