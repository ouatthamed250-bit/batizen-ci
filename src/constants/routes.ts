import { Bell, Calculator, FolderKanban, Home, MessageCircle, UserRound, type LucideIcon } from "lucide-react";

export type AppRoute = {
  label: string;
  href: string;
  icon: LucideIcon;
};

export const tabRoutes: AppRoute[] = [
  { label: "Accueil", href: "/", icon: Home },
  { label: "Projets", href: "/projets", icon: FolderKanban },
  { label: "Devis", href: "/devis", icon: Calculator },
  { label: "Messages", href: "/messages", icon: MessageCircle },
  { label: "Profil", href: "/profil", icon: UserRound },
];

export const quickRoutes: AppRoute[] = [
  { label: "Notifications", href: "/notifications", icon: Bell },
  { label: "Assistant IA", href: "/assistant-chat", icon: MessageCircle },
  { label: "Simulation", href: "/simulation", icon: Calculator },
];
