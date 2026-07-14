"use client";

import { useEffect, useState } from "react";

export default function RenovationHero() {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <section className="relative flex h-[70vh] min-h-[500px] items-center justify-center overflow-hidden">
      {/* Image de fond avec parallaxe */}
      <div
        className="absolute inset-0 bg-cover bg-center transition-transform duration-300"
        style={{
          backgroundImage:
            'url("https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=1600&q=85")',
          transform: `translateY(${scrollY * 0.35}px) scale(1.1)`,
        }}
      />

      {/* Overlay gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/60 to-black/80" />

      {/* Contenu */}
      <div className="relative z-10 mx-auto max-w-4xl px-6 text-center">
        <h1
          className="text-5xl font-black leading-tight text-white md:text-6xl"
          style={{
            textShadow: "0 0 30px rgba(255, 107, 0, 0.5), 0 0 60px rgba(255, 107, 0, 0.2)",
            animation: "heroFadeIn 1s ease-out both",
          }}
        >
          Transformez votre espace
        </h1>
        <p
          className="mx-auto mt-6 max-w-2xl text-xl font-semibold text-white/90"
          style={{
            textShadow: "0 0 20px rgba(255, 107, 0, 0.3)",
            animation: "heroFadeIn 1s ease-out 0.3s both",
          }}
        >
          Services de rénovation professionnels
        </p>
        <p
          className="mx-auto mt-4 max-w-xl text-base text-white/70"
          style={{ animation: "heroFadeIn 1s ease-out 0.5s both" }}
        >
          De la simple peinture à la rénovation complète, nos experts transforment votre
          intérieur avec qualité et professionnalisme.
        </p>

        {/* Indicateur de scroll */}
        <div
          className="mt-12 flex flex-col items-center gap-2"
          style={{ animation: "heroFadeIn 1s ease-out 0.7s both" }}
        >
          <span className="text-xs font-bold uppercase tracking-widest text-white/50">
            Découvrez nos services
          </span>
          <div className="flex flex-col items-center gap-1">
            <span className="block h-8 w-[2px] rounded-full bg-gradient-to-b from-[#FF6B00] to-transparent" />
            <div className="h-2 w-2 animate-bounce rounded-full bg-[#FF6B00]" />
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes heroFadeIn {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </section>
  );
}