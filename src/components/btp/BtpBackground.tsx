"use client";

import { useEffect, useState } from "react";

interface BtpBackgroundProps {
  imageUrl?: string;
  children: React.ReactNode;
  overlay?: "light" | "medium" | "heavy";
  parallax?: boolean;
}

export default function BtpBackground({
  imageUrl,
  children,
  overlay = "medium",
  parallax = true,
}: BtpBackgroundProps) {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    if (!parallax) return;
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [parallax]);

  // Overlay bleu premium cohérent (plus de noir)
  const overlayOpacity =
    overlay === "light" ? "from-[#0D2B6B]/40 via-[#0D2B6B]/50 to-[#0D2B6B]/60" :
    overlay === "heavy" ? "from-[#0D2B6B]/70 via-[#0D2B6B]/80 to-[#0D2B6B]/90" :
    "from-[#0D2B6B]/60 via-[#0D2B6B]/70 to-[#0D2B6B]/80";

  return (
    // CORRECTION : min-h-screen au lieu de min-h-[60vh] pour couvrir tout le scroll
    <section className="relative flex min-h-screen w-full items-start justify-center overflow-hidden">
      {imageUrl && (
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url("${imageUrl}")`,
            transform: parallax ? `translateY(${scrollY * 0.2}px) scale(1.1)` : "scale(1.1)",
            transition: parallax ? "none" : "none",
          }}
        />
      )}

      {/* Overlay dégradé bleu */}
      <div className={`absolute inset-0 bg-gradient-to-b ${overlayOpacity}`} />
      
      {/* Texture béton subtile par-dessus */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='white' fill-opacity='0.3'%3E%3Cpath d='M20 0l20 20-20 20L0 20z'/%3E%3C/g%3E%3C/svg%3E\")",
          backgroundSize: "40px 40px",
        }}
      />

      {/* Contenu */}
      <div className="relative z-10 w-full max-w-[430px] mx-auto pt-4 pb-24">{children}</div>
    </section>
  );
}