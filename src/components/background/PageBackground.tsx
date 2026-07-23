"use client";

import { type ReactNode } from "react";
import Image from "next/image";
import { FallbackBackground } from "@/components/background/FallbackBackground";

interface Props {
  src: string;
  children: ReactNode;
  overlayOpacity?: number;
}

export function PageBackground({ src, children, overlayOpacity = 0.4 }: Props) {
  return (
    <div className="relative min-h-screen w-full">
      <Image
        src={src}
        alt="Background"
        fill
        className="object-cover"
        quality={85}
        priority
      />
      <div
        className="absolute inset-0"
        style={{ backgroundColor: `rgba(0,0,0,${overlayOpacity})` }}
      />
      <FallbackBackground variant="dark">
        <div className="relative z-10">{children}</div>
      </FallbackBackground>
    </div>
  );
}