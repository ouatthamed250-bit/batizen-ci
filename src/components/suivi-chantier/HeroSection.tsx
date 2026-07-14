"use client";

import { useEffect, useRef, useState } from "react";

export default function HeroSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [offsetY, setOffsetY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      if (sectionRef.current) {
        const rect = sectionRef.current.getBoundingClientRect();
        const scrollPos = window.scrollY;
        const sectionTop = sectionRef.current.offsetTop;
        const diff = scrollPos - sectionTop;
        if (diff > 0) {
          setOffsetY(diff * 0.4);
        } else {
          setOffsetY(0);
        }
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative w-full h-[70vh] min-h-[500px] overflow-hidden flex items-center justify-center"
    >
      {/* Image de fond avec effet parallaxe */}
      <div
        className="absolute inset-0 w-full h-[120%] bg-cover bg-center will-change-transform"
        style={{
          backgroundImage:
            "url(https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=1920&q=85)",
          transform: `translateY(${offsetY}px)`,
        }}
      />

      {/* Overlay gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/40 to-black/80" />

      {/* Overlay supplémentaire pour texture */}
      <div className="absolute inset-0 bg-[rgba(0,0,0,0.2)]" />

      {/* Contenu */}
      <div className="relative z-10 text-center px-6 max-w-4xl mx-auto">
        <h1
          className="text-white font-bold text-4xl md:text-5xl lg:text-6xl leading-tight mb-6 animate-fadeInUp"
          style={{
            textShadow: "0 0 20px rgba(255, 107, 0, 0.5)",
          }}
        >
          Suivi de vos chantiers en temps réel
        </h1>
        <p
          className="text-white/90 text-lg md:text-xl max-w-2xl mx-auto animate-fadeInUp stagger-2"
          style={{
            textShadow: "0 0 15px rgba(255, 107, 0, 0.3)",
          }}
        >
          Gardez un œil sur l'avancement de vos projets
        </p>

        {/* Indicateur de scroll */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <svg
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="opacity-60"
          >
            <path d="M7 13l5 5 5-5" />
            <path d="M7 6l5 5 5-5" />
          </svg>
        </div>
      </div>
    </section>
  );
}