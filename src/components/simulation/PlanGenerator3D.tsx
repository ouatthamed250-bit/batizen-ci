"use client";

import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { useRef, useState, useEffect } from "react";
import { Mesh } from "three";
import { ErrorBoundary } from "@/components/ErrorBoundary";

interface Plan3DProps {
  surface: number;
  largeur: number;
  longueur: number;
  chambres: number;
  sallesDeBain: number;
  etages: number;
  garage: boolean;
  piscine: boolean;
  style: string;
}

const getHouseColor = (style: string) => {
  switch (style) {
    case "Moderne": return "#FFFFFF";
    case "Classique": return "#F5DEB3";
    case "Africain": return "#D2B48C";
    case "Contemporain": return "#E0E0E0";
    case "Colonial": return "#DEB887";
    default: return "#FFFFFF";
  }
};

function Loader3D() {
  return (
    <div className="w-full h-[400px] flex flex-col items-center justify-center bg-gradient-to-br from-white/90 to-white/70 backdrop-blur-lg rounded-2xl border border-white/30 shadow-lg">
      <div className="relative mb-6">
        <div className="w-20 h-20 border-4 border-[#FF6B00]/20 border-t-[#FF6B00] rounded-full animate-spin"></div>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-3xl">🏠</span>
        </div>
      </div>
      <h3 className="text-lg font-bold text-[var(--navy)] mb-2 text-center px-4">
        Chargement de la vue 3D...
      </h3>
      <p className="text-sm text-gray-600 text-center px-6 mb-4">
        Préparation de la maquette
      </p>
    </div>
  );
}

function ThreeDErrorFallback() {
  return (
    <div className="w-full h-[400px] flex flex-col items-center justify-center bg-gradient-to-br from-red-50 to-red-100 backdrop-blur-lg rounded-2xl border border-red-200 shadow-lg p-6">
      <span className="text-5xl mb-4">⚠️</span>
      <h3 className="text-lg font-bold text-red-700 mb-2 text-center">
        La vue 3D n'a pas pu se charger
      </h3>
      <p className="text-sm text-red-600 text-center px-6">
        Essayez la vue 2D pour visualiser votre plan.
      </p>
    </div>
  );
}

function House({
  largeur,
  longueur,
  etages,
  chambres,
  sallesDeBain,
  garage,
  piscine,
  style,
}: {
  largeur: number;
  longueur: number;
  etages: number;
  chambres: number;
  sallesDeBain: number;
  garage: boolean;
  piscine: boolean;
  style: string;
}) {
  const houseRef = useRef<Mesh>(null!);

  const buildingWidth = Math.max(8, largeur * 0.8);
  const buildingLength = Math.max(8, longueur * 0.8);
  const buildingHeight = etages * 3;

  const windows = [];
  for (let i = 0; i < etages; i++) {
    for (let j = 0; j < Math.min(4, Math.ceil(chambres / 2)); j++) {
      const x = -buildingWidth / 2 + 1 + j * 2;
      const y = -1.5 + i * 3;
      const z = buildingLength / 2 + 0.06;
      windows.push(
        <mesh key={`w-${i}-${j}`} position={[x, y, z]}>
          <boxGeometry args={[1.5, 1.2, 0.1]} />
          <meshStandardMaterial color="#87CEEB" opacity={0.7} transparent />
        </mesh>
      );
    }
  }

  return (
    <group ref={houseRef}>
      <mesh position={[0, -0.1, 0]} receiveShadow>
        <boxGeometry args={[buildingWidth + 10, 0.2, buildingLength + 10]} />
        <meshStandardMaterial color="#22C55E" />
      </mesh>

      <mesh position={[0, buildingHeight / 2 - 1.5, 0]} castShadow>
        <boxGeometry args={[buildingWidth, buildingHeight, buildingLength]} />
        <meshStandardMaterial color={getHouseColor(style)} roughness={0.7} />
      </mesh>

      {windows}

      <mesh position={[0, -0.5, buildingLength / 2 + 0.07]}>
        <boxGeometry args={[1.5, 2.5, 0.1]} />
        <meshStandardMaterial color="#8B4513" />
      </mesh>

      {style === "Moderne" ? (
        <mesh position={[0, buildingHeight / 2 + 1.5, 0]}>
          <boxGeometry args={[buildingWidth * 1.05, 0.3, buildingLength * 1.05]} />
          <meshStandardMaterial color="#6B7280" />
        </mesh>
      ) : (
        <mesh position={[0, buildingHeight / 2 + 2, 0]}>
          <coneGeometry args={[buildingWidth * 0.6, 1.5, 4]} />
          <meshStandardMaterial color="#8B4513" />
        </mesh>
      )}

      {garage && (
        <group position={[-buildingWidth / 2 - 2.5, 0.2, 0]}>
          <mesh position={[0, 0, 0]} castShadow>
            <boxGeometry args={[2, 2, 2.5]} />
            <meshStandardMaterial color="#9CA3AF" />
          </mesh>
          <mesh position={[0, 0, buildingLength / 2 + 0.1]}>
            <boxGeometry args={[1.5, 1.8, 0.1]} />
            <meshStandardMaterial color="#6B7280" />
          </mesh>
        </group>
      )}

      {piscine && (
        <mesh position={[buildingWidth / 2 + 1.5, -0.05, 0]}>
          <boxGeometry args={[3, 0.1, 1.5]} />
          <meshStandardMaterial color="#3B82F6" />
        </mesh>
      )}
    </group>
  );
}

export default function PlanGenerator3D({
  surface,
  largeur,
  longueur,
  chambres,
  sallesDeBain,
  etages,
  garage,
  piscine,
  style,
}: Plan3DProps) {
  const [isLoading, setIsLoading] = useState(true);

  // Loader réel : temps de montage Three.js (min 500ms pour la lisibilité)
  useEffect(() => {
    const startTime = Date.now();
    requestAnimationFrame(() => {
      const elapsed = Date.now() - startTime;
      const delay = Math.max(500 - elapsed, 0);
      setTimeout(() => setIsLoading(false), delay);
    });
  }, []);

  return (
    <div className="w-full">
      {isLoading ? (
        <Loader3D />
      ) : (
        <>
          <div className="w-full max-w-[400px] h-[400px] mx-auto border-2 border-white/20 rounded-xl overflow-hidden">
            <ErrorBoundary fallback={<ThreeDErrorFallback />}>
              <Canvas
                camera={{ position: [15, 12, 15], fov: 50 }}
                shadows
              >
                <ambientLight intensity={0.6} />
                <directionalLight
                  position={[10, 10, 5]}
                  intensity={1}
                  castShadow
                  shadow-mapSize-width={1024}
                  shadow-mapSize-height={1024}
                />
                
                <House
                  largeur={largeur}
                  longueur={longueur}
                  etages={etages}
                  chambres={chambres}
                  sallesDeBain={sallesDeBain}
                  garage={garage}
                  piscine={piscine}
                  style={style}
                />
                
                <OrbitControls
                  enableZoom={true}
                  enablePan={false}
                  autoRotate
                  autoRotateSpeed={0.5}
                />
              </Canvas>
            </ErrorBoundary>
          </div>

          <div className="text-center text-sm text-white/60 mt-3">
            <p>Surface: {surface}m² | {etages} étage{ etages > 1 ? 's' : ''}</p>
            <p>{chambres} chambre{chambres > 1 ? 's' : ''} • {sallesDeBain} salle{ sallesDeBain > 1 ? 's' : ''} de bain</p>
          </div>
        </>
      )}
    </div>
  );
}