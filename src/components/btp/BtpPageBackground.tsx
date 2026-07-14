"use client";

import { ReactNode } from "react";

interface BtpPageBackgroundProps {
  children: ReactNode;
  imageUrl: string;
  overlayClassName?: string;
}

export default function BtpPageBackground({ children, imageUrl, overlayClassName = "bg-black/65" }: BtpPageBackgroundProps) {
  return (
    <div className="relative min-h-screen">
      <div className="fixed inset-0 -z-10">
        <div
          className="h-full w-full bg-cover bg-center"
          style={{
            backgroundImage: `url(${imageUrl})`,
            transform: "translateZ(0)",
          }}
        />
        <div className={`absolute inset-0 ${overlayClassName}`} />
      </div>
      <div className="relative z-10">{children}</div>
    </div>
  );
}