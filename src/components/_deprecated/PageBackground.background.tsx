"use client";

import Image from "next/image";

interface Props {
  src: string;
  children: React.ReactNode;
  overlayOpacity?: number;
}

export function PageBackground({ src, children, overlayOpacity = 0.4 }: Props) {
  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      {/* Image de fond fixe */}
      <div className="fixed inset-0 z-0">
        <Image
          src={src}
          alt="Background"
          fill
          priority
          className="object-cover object-center"
          style={{ zIndex: 0 }}
        />
        {/* Overlay */}
        <div
          className="absolute inset-0 z-10"
          style={{ background: `linear-gradient(to bottom, rgba(0,0,0,${overlayOpacity}), rgba(0,0,0,0.75))` }}
        />
      </div>
      {/* Contenu au-dessus */}
      <div className="relative z-20 min-h-screen">
        {children}
      </div>
    </div>
  );
}