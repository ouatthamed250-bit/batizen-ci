import Image from "next/image";
import type { LucideIcon } from "lucide-react";
import { Mail, Lock, UserRound } from "lucide-react";
import { PremiumButton } from "@/components/ui/PremiumButton";
import { PremiumCard } from "@/components/ui/PremiumCard";
import { PremiumInput } from "@/components/ui/PremiumInput";
import { imagePaths } from "@/lib/helpers";

type AuthScreenProps = {
  title: string;
  subtitle: string;
  mode: "login" | "register" | "forgot" | "welcome";
  icon: LucideIcon;
};

export function AuthScreen({ title, subtitle, mode, icon: Icon }: AuthScreenProps) {
  const isRegister = mode === "register";
  const isForgot = mode === "forgot";

  return (
    <main className="grid min-h-screen place-items-center bg-[radial-gradient(circle_at_top,#EAF2FF,transparent_38%),linear-gradient(180deg,#F7F9FC,#FFFFFF)] px-4 py-10">
      <PremiumCard className="w-full max-w-[520px]">
        <div className="mb-7 flex items-center gap-4">
          <Image alt="BÂTIZEN CI" className="rounded-2xl" height={56} src={imagePaths.logo} width={56} />
          <div>
            <p className="text-sm font-black uppercase tracking-[0.18em] text-[#0B5FFF]">BÂTIZEN CI</p>
            <h1 className="text-3xl font-black tracking-[-0.04em] text-[#111827]">{title}</h1>
          </div>
        </div>
        <div className="mb-7 grid size-14 place-items-center rounded-[22px] bg-[#0B5FFF] text-white shadow-[0_14px_30px_rgba(11,95,255,0.3)]"><Icon size={26} /></div>
        <p className="mb-7 text-[#6B7280]">{subtitle}</p>
        {mode === "welcome" ? (
          <div className="grid gap-3">
            <PremiumButton href="/login">Se connecter</PremiumButton>
            <PremiumButton href="/register" variant="google">Créer un compte</PremiumButton>
          </div>
        ) : (
          <form className="grid gap-4">
            {isRegister ? <PremiumInput icon={UserRound} label="Nom complet" placeholder="Awa Koné" /> : null}
            <PremiumInput icon={Mail} label="Adresse email" placeholder="vous@exemple.ci" type="email" />
            {!isForgot ? <PremiumInput icon={Lock} label="Mot de passe" placeholder="••••••••" type="password" /> : null}
            <PremiumButton type="submit">{isForgot ? "Recevoir le lien" : isRegister ? "Créer mon compte" : "Se connecter"}</PremiumButton>
            <PremiumButton href="/welcome" variant="google">Continuer avec Google</PremiumButton>
          </form>
        )}
      </PremiumCard>
    </main>
  );
}
