"use client";

interface Particle {
  id: number;
  left: number;
  animationDelay: number;
  animationDuration: number;
  size: number;
}

const PARTICLES: Particle[] = [
  { id: 0, left: 83, animationDelay: 1.2, animationDuration: 5.7, size: 3.6 },
  { id: 1, left: 45, animationDelay: 3.4, animationDuration: 6.3, size: 4.2 },
  { id: 2, left: 12, animationDelay: 0.5, animationDuration: 7.1, size: 2.8 },
  { id: 3, left: 67, animationDelay: 2.8, animationDuration: 4.9, size: 3.3 },
  { id: 4, left: 29, animationDelay: 4.1, animationDuration: 6.8, size: 2.5 },
  { id: 5, left: 91, animationDelay: 1.7, animationDuration: 5.2, size: 4.0 },
  { id: 6, left: 53, animationDelay: 3.9, animationDuration: 7.4, size: 3.1 },
  { id: 7, left: 8, animationDelay: 0.9, animationDuration: 6.0, size: 2.9 },
  { id: 8, left: 74, animationDelay: 2.3, animationDuration: 5.5, size: 3.8 },
  { id: 9, left: 38, animationDelay: 4.6, animationDuration: 6.6, size: 2.6 },
  { id: 10, left: 19, animationDelay: 1.5, animationDuration: 7.8, size: 3.4 },
  { id: 11, left: 61, animationDelay: 3.2, animationDuration: 5.9, size: 4.4 },
];

export default function BtpDustParticles() {
  return (
    <div className="btp-dust-container" aria-hidden="true">
      {PARTICLES.map((p) => (
        <div
          key={p.id}
          className="btp-dust-particle"
          style={{
            left: `${p.left}%`,
            bottom: "-10px",
            width: `${p.size}px`,
            height: `${p.size}px`,
            animationDelay: `${p.animationDelay}s`,
            animationDuration: `${p.animationDuration}s`,
          }}
        />
      ))}
    </div>
  );
}
