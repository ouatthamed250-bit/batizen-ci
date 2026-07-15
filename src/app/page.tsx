"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { PageBackground } from "@/components/layout/PageBackground";

export default function SplashPage() {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      router.replace("/dashboard");
    }, 3200);
    return () => clearTimeout(timer);
  }, [router]);

  return (
    <PageBackground src="/images/villa-bg.jpg" overlayOpacity={0.3}>
      <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center overflow-hidden">
        {/* Cercles lumineux background */}
        <div className="absolute -top-32 -right-32 size-96 rounded-full bg-[#0B5FFF] opacity-[0.06] blur-[100px]" />
        <div className="absolute -bottom-40 -left-40 size-[500px] rounded-full bg-[#FF7A00] opacity-[0.06] blur-[120px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-72 rounded-full" style={{ animation: "splashGlow 2s ease-in-out infinite" }} />

        {/* Logo animé */}
        <div className="relative" style={{ animation: "splashLogoScale 1.2s cubic-bezier(0.34, 1.56, 0.64, 1) both" }}>
          <Image src="/assets/images/logo.png" alt="BÂTIZEN CI" width={140} height={140} className="rounded-[36px] shadow-[0_30px_60px_rgba(11,95,255,0.2)]" />
        </div>

        {/* Texte */}
        <div className="mt-8 text-center" style={{ animation: "splashText 0.8s ease-out 0.6s both" }}>
          <h1 className="text-3xl font-black tracking-[-0.05em]">
            <span className="text-white">BÂTIZEN</span>{" "}
            <span className="text-[#FF7A00]">CI</span>
          </h1>
          <div className="mt-2 flex items-center justify-center gap-2">
            <div className="h-px w-6 bg-[#FF7A00]" />
            <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#FF7A00]">Construction Technology</p>
            <div className="h-px w-6 bg-[#FF7A00]" />
          </div>
          <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.2em] text-[#ccc]">🌍 Côte d'Ivoire</p>
        </div>

        {/* Loader dots */}
        <div className="mt-12 flex gap-2" style={{ animation: "splashText 0.6s ease-out 1.2s both" }}>
          {[0, 1, 2].map(i => (
            <div key={i} className="size-2 rounded-full bg-[#FF7A00]" style={{ animation: "softPulse 1s ease-in-out infinite", animationDelay: `${i * 0.2}s` }} />
          ))}
        </div>
      </div>
    </PageBackground>
  );
}