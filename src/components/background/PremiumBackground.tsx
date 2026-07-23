"use client";

import { type ReactNode, useState } from "react";
import Image from "next/image";
import { useTheme } from "@/contexts/ThemeContext";
import { FallbackBackground } from "@/components/background/FallbackBackground";

interface PremiumBackgroundProps {
  children: ReactNode;
  imageUrl?: string;
  overlayClassName?: string;
}

// Images premium par défaut - chantiers et villas modernes
const DEFAULT_IMAGES = [
  "https://images.unsplash.com/photo-1600584381426-93885c20958a?q=80&w=2070&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1504307651254-35680f356dfd?q=80&w=2070&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1600607687949-ce7752b5c8f2?q=80&w=2070&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1600566847245-5a37b4891b3c?q=80&w=2070&auto=format&fit=crop",
];

export default function PremiumBackground({ 
  children, 
  imageUrl, 
  overlayClassName 
}: PremiumBackgroundProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [imageError, setImageError] = useState(false);
  
  const imageIndex = Math.floor(new Date().getHours() / 6) % DEFAULT_IMAGES.length;
  const bgImage = imageUrl || DEFAULT_IMAGES[imageIndex];

  if (imageError) {
    return (
      <FallbackBackground variant={isDark ? "dark" : "light"}>
        <div className="relative z-10 min-h-screen">
          {children}
        </div>
      </FallbackBackground>
    );
  }

  return (
    <div className="relative min-h-screen">
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <Image
          src={bgImage}
          alt="Background premium BÂTIZEN CI"
          fill
          className={`object-cover transition-all duration-700 ${isDark ? "brightness-75 contrast-110" : ""}`}
          quality={85}
          priority={false}
          loading="lazy"
          unoptimized={false}
          onError={() => setImageError(true)}
        />
        <div 
          className={`absolute inset-0 ${
            isDark 
              ? "bg-gradient-to-b from-[#111827]/85 via-[#111827]/50 to-[#111827]/80" 
              : "bg-gradient-to-b from-white/50 via-white/20 to-white/40"
          } ${overlayClassName || ""}`}
        />
      </div>
      
      <div className="relative z-10 min-h-screen">
        {children}
      </div>
    </div>
  );
}