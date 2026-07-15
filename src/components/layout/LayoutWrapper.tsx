"use client";

import { usePathname } from "next/navigation";
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
  const { user } = useAuthContext();

  const publicPages = ["/", "/login", "/register", "/forgot-password"];
  const isPublicPage = publicPages.includes(pathname);
  const showLayout = !isPublicPage && user;

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