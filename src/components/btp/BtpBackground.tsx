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

  const overlayOpacity =
    overlay === "light" ? "from-black/30 via-black/40 to-black/50" :
    overlay === "heavy" ? "from-black/60 via-black/70 to-black/80" :
    "from-black/40 via-black/55 to-black/70";

  return (
    <section className="relative flex min-h-[60vh] items-center justify-center overflow-hidden">
      {imageUrl && (
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url("${imageUrl}")`,
            transform: parallax ? `translateY(${scrollY * 0.3}px) scale(1.1)` : "scale(1.1)",
            transition: parallax ? "none" : "none",
          }}
        />
      )}

      {/* Overlay */}
      <div className={`absolute inset-0 bg-gradient-to-b ${overlayOpacity}`} />

      {/* Texture béton par-dessus */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='white' fill-opacity='0.3'%3E%3Cpath d='M20 0l20 20-20 20L0 20z'/%3E%3C/g%3E%3C/svg%3E\")",
          backgroundSize: "40px 40px",
        }}
      />

      {/* Contenu */}
      <div className="relative z-10 w-full">{children}</div>
    </section>
  );
}