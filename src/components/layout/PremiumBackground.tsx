"use client";

import { type ReactNode } from "react";
import Image from "next/image";
import { useTheme } from "@/contexts/ThemeContext";

interface PremiumBackgroundProps {
  children: ReactNode;
  imageUrl?: string;
  overlayClassName?: string;
}

// Images premium par défaut
const DEFAULT_IMAGES = [
  "https://images.unsplash.com/photo-1504307651254-35680f356dfd?q=80&w=2070&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1600584381426-93885c20958a?q=80&w=2070&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1541959205199-fc052860126e?q=80&w=2070&auto=format&fit=crop",
];

export default function PremiumBackground({ 
  children, 
  imageUrl, 
  overlayClassName 
}: PremiumBackgroundProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const bgImage = imageUrl || DEFAULT_IMAGES[0];

  return (
    <div className="relative min-h-screen">
      {/* Background image avec lazy loading */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <Image
          src={bgImage}
          alt="Background premium"
          fill
          className={`object-cover transition-all duration-700 ${isDark ? "brightness-50" : ""}`}
          quality={85}
          priority={false}
          loading="lazy"
        />
        {/* Overlay glassmorphism */}
        <div 
          className={`absolute inset-0 ${
            isDark 
              ? "bg-gradient-to-b from-[#081423]/95 via-[#081423]/85 to-[#081423]/90" 
              : "bg-gradient-to-b from-white/90 via-white/70 to-white/85"
          } ${overlayClassName || ""}`}
        />
      </div>
      
      {/* Content avec glassmorphism */}
      <div className="relative z-10 min-h-screen">
        {children}
      </div>
    </div>
  );
}