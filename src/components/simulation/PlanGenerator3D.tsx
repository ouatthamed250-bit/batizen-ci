"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { useRef, useState, useEffect } from "react";
import { Mesh } from "three";

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

// Couleurs selon le style
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

// Loader professionnel
function Loader3D() {
  return (
    <div className="w-full h-[400px] flex flex-col items-center justify-center bg-gradient-to-br from-white/90 to-white/70 backdrop-blur-lg rounded-2xl border border-white/30 shadow-lg">
      {/* Spinner animé */}
      <div className="relative mb-6">
        <div className="w-20 h-20 border-4 border-[#FF6B00]/20 border-t-[#FF6B00] rounded-full animate-spin"></div>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-3xl">🏠</span>
        </div>
      </div>
      
      {/* Message principal */}
      <h3 className="text-lg font-bold text-[var(--navy)] mb-2 text-center px-4">
        Votre plan 3D est en préparation
      </h3>
      
      {/* Message secondaire */}
      <p className="text-sm text-gray-600 text-center px-6 mb-4">
        Nos architectes génèrent votre maquette 3D personnalisée...
      </p>
      
      {/* Message de confiance */}
      <div className="bg-[#FF6B00]/10 border border-[#FF6B00]/30 rounded-xl px-4 py-2">
        <p className="text-xs text-[#FF6B00] font-semibold text-center">
          🏗️ Faites confiance à BATIZEN.CI - Votre partenaire BTP
        </p>
      </div>
      
      {/* Barre de progression simulée */}
      <div className="w-48 h-2 bg-gray-200 rounded-full mt-6 overflow-hidden">
        <div className="h-full bg-gradient-to-r from-[#FF6B00] to-[#FF8C00] rounded-full animate-pulse" style={{width: '70%'}}></div>
      </div>
    </div>
  );
}

// Composant Maison
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

  useFrame(() => {
    houseRef.current.rotation.y += 0.002;
  });

  const buildingWidth = Math.max(8, largeur * 0.8);
  const buildingLength = Math.max(8, longueur * 0.8);
  const buildingHeight = etages * 3;

  // Générer fenêtres selon le nombre de chambres
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
      {/* Sol */}
      <mesh position={[0, -0.1, 0]} receiveShadow>
        <boxGeometry args={[buildingWidth + 10, 0.2, buildingLength + 10]} />
        <meshStandardMaterial color="#22C55E" />
      </mesh>

      {/* Corps de la maison */}
      <mesh position={[0, buildingHeight / 2 - 1.5, 0]} castShadow>
        <boxGeometry args={[buildingWidth, buildingHeight, buildingLength]} />
        <meshStandardMaterial color={getHouseColor(style)} roughness={0.7} />
      </mesh>

      {/* Fenêtres */}
      {windows}

      {/* Porte d'entrée */}
      <mesh position={[0, -0.5, buildingLength / 2 + 0.07]}>
        <boxGeometry args={[1.5, 2.5, 0.1]} />
        <meshStandardMaterial color="#8B4513" />
      </mesh>

      {/* Toit selon le style */}
      {style === "Moderne" ? (
        <mesh position={[0, buildingHeight / 2 + 1.5, 0]}>
          <boxGeometry args={[buildingWidth * 1.05, 0.3, buildingLength * 1.05]} />
          <meshStandardMaterial color="#6B7280" />
        </mesh>
      ) : style === "Africain" ? (
        <mesh position={[0, buildingHeight / 2 + 2, 0]}>
          <coneGeometry args={[buildingWidth * 0.6, 1.5, 4]} />
          <meshStandardMaterial color="#8B4513" />
        </mesh>
      ) : style === "Colonial" ? (
        <mesh position={[0, buildingHeight / 2 + 2, 0]}>
          <coneGeometry args={[buildingWidth * 0.6, 1.5, 4]} />
          <meshStandardMaterial color="#8B4513" />
        </mesh>
      ) : (
        <mesh position={[0, buildingHeight / 2 + 2, 0]}>
          <coneGeometry args={[buildingWidth * 0.6, 1.5, 4]} />
          <meshStandardMaterial color="#8B4513" />
        </mesh>
      )}

      {/* Garage */}
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

      {/* Piscine */}
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
  const [viewMode, setViewMode] = useState<"2d" | "3d">("3d");
  const [isLoading, setIsLoading] = useState(true);

  // Loader de 10 secondes minimum
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 10000);
    
    return () => clearTimeout(timer);
  }, []);

  const downloadPNG = () => {
    // La capture d'écran est gérée par le composant parent via ref
  };

  return (
    <div className="w-full">
      {isLoading ? (
        <Loader3D />
      ) : (
        <>
          {/* Canvas 3D */}
          <div className="w-full max-w-[400px] h-[400px] mx-auto border-2 border-white/20 rounded-xl overflow-hidden">
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
          </div>

          {/* Boutons */}
          <div className="flex gap-2 justify-center">
            <button
              className={`px-4 py-2 rounded-xl font-semibold text-sm transition ${
                viewMode === "2d"
                  ? "bg-gradient-to-b from-[#FF8C00] to-[#CC5500] text-white"
                  : "bg-white/20 text-white"
              }`}
              onClick={() => setViewMode("2d")}
            >
              📐 Vue 2D
            </button>
            <button
              className={`px-4 py-2 rounded-xl font-semibold text-sm transition ${
                viewMode === "3d"
                  ? "bg-gradient-to-b from-[#FF8C00] to-[#CC5500] text-white"
                  : "bg-white/20 text-white"
              }`}
              onClick={() => setViewMode("3d")}
            >
              🏠 Vue 3D
            </button>
            <button
              onClick={downloadPNG}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border border-white/20 bg-white/10 font-semibold text-white transition hover:bg-white/20"
            >
              📥 Télécharger PNG
            </button>
          </div>

          {/* Infos */}
          <div className="text-center text-sm text-white/60">
            <p>Surface: {surface}m² | {etages} étage{ etages > 1 ? 's' : ''}</p>
            <p>{chambres} chambre{chambres > 1 ? 's' : ''} • {sallesDeBain} salle{ sallesDeBain > 1 ? 's' : ''} de bain</p>
            {garage && <p>Garage: Oui</p>}
            {piscine && <p>Piscine: Oui</p>}
          </div>
        </>
      )}
    </div>
  );
}