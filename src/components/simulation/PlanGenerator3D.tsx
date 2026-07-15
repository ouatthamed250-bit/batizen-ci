"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, PerspectiveCamera } from "@react-three/drei";
import { useRef } from "react";
import { Mesh } from "three";

interface PlanGenerator3DProps {
  surface: number;
  largeur: number;
  longueur: number;
  chambres: number;
  sallesDeBain: number;
  etages: number;
  garage: boolean;
  piscine: boolean;
  style?: string;
}

function House({ etages, largeur, longueur, style }: { etages: number; largeur: number; longueur: number; style?: string }) {
  const meshRef = useRef<Mesh>(null!);
  
  useFrame(() => {
    meshRef.current.rotation.y += 0.002;
  });

  const getCouleur = () => {
    switch (style) {
      case "Moderne": return "#FFFFFF";
      case "Classique": return "#F5DEB3";
      case "Africain": return "#D2B48C";
      case "Contemporain": return "#E0E0E0";
      case "Colonial": return "#DEB887";
      default: return "#FFFFFF";
    }
  };

  return (
    <group>
      {/* Sol */}
      <mesh position={[0, -0.1, 0]}>
        <boxGeometry args={[largeur, 0.2, longueur]} />
        <meshStandardMaterial color="#22C55E" />
      </mesh>
      
      {/* Maison - étages */}
      {Array.from({ length: etages }).map((_, i) => (
        <mesh key={i} position={[0, i * 3 + 1.5, 0]} ref={i === 0 ? meshRef : undefined}>
          <boxGeometry args={[largeur * 0.8, 3, longueur * 0.8]} />
          <meshStandardMaterial color={getCouleur()} />
        </mesh>
      ))}
      
      {/* Toit selon style */}
      {style === "Moderne" ? (
        <mesh position={[0, etages * 3 + 1.5, 0]}>
          <boxGeometry args={[largeur * 0.85, 0.5, longueur * 0.85]} />
          <meshStandardMaterial color="#6B7280" />
        </mesh>
      ) : style === "Africain" ? (
        <mesh position={[0, etages * 3 + 2.5, 0]}>
          <coneGeometry args={[largeur * 0.5, 2, 4]} />
          <meshStandardMaterial color="#D2B48C" />
        </mesh>
      ) : (
        <mesh position={[0, etages * 3 + 2.5, 0]}>
          <coneGeometry args={[largeur * 0.5, 2, 4]} />
          <meshStandardMaterial color="#8B4513" />
        </mesh>
      )}

      {/* Fenêtres */}
      {Array.from({ length: etages * 2 }).map((_, i) => (
        <mesh key={`f${i}`} position={[-largeur * 0.3, i % 2 * 3 + 1.5, 0]}>
          <boxGeometry args={[0.3, 1, 0.1]} />
          <meshStandardMaterial color="#87CEEB" opacity={0.7} transparent />
        </mesh>
      ))}

      {/* Garage si demandé */}
      <mesh position={[largeur * 0.5, 0, longueur * 0.3]} visible={true}>
        <boxGeometry args={[3, 2, 2]} />
        <meshStandardMaterial color="#9CA3AF" />
      </mesh>

      {/* Piscine si demandée */}
      <mesh position={[largeur * 0.5, -0.05, -longueur * 0.3]} visible={true}>
        <boxGeometry args={[2, 0.1, 3]} />
        <meshStandardMaterial color="#3B82F6" />
      </mesh>
    </group>
  );
}

export default function PlanGenerator3D({
  etages,
  largeur,
  longueur,
  style,
}: PlanGenerator3DProps) {
  return (
    <div className="w-full max-w-[400px] h-[400px] mx-auto">
      <Canvas>
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1.0} castShadow />
        <House etages={etages} largeur={largeur} longueur={longueur} style={style} />
        <OrbitControls enableZoom={true} enablePan={false} />
        <PerspectiveCamera makeDefault position={[largeur * 2, largeur * 1.5, longueur * 2]} />
      </Canvas>
    </div>
  );
}