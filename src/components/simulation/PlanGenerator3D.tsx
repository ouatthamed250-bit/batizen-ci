"use client";

import { Canvas } from "@react-three/fiber";
import { OrbitControls, Text } from "@react-three/drei";
import { useMemo } from "react";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import type { GeneratedPlan, PlanRoom } from "@/types/batizen";

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
  /** Optionnel : données du plan généré par PlanEngine (si fourni, rend les pièces dynamiquement) */
  plan?: GeneratedPlan | null;
}

function PlanEmptyState() {
  return (
    <div className="w-full h-[400px] flex flex-col items-center justify-center bg-gradient-to-br from-white/90 to-white/70 backdrop-blur-lg rounded-2xl border border-white/30 shadow-lg p-6">
      <span className="text-5xl mb-4">🏗️</span>
      <h3 className="text-lg font-bold text-[var(--navy)] mb-2 text-center">
        Générez un plan pour voir la vue 3D
      </h3>
      <p className="text-sm text-gray-600 text-center">
        Utilisez le formulaire de simulation pour créer votre plan.
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
      <p className="text-sm text-red-600 text-center">
        Essayez la vue 2D pour visualiser votre plan.
      </p>
    </div>
  );
}

/** Palette de couleurs par type de pièce */
function getRoomColor(label: string): string {
  const l = label.toLowerCase();
  if (l.includes("salon") || l.includes("séjour")) return "#FFF3E0";
  if (l.includes("cuisine")) return "#FFECB3";
  if (l.includes("chambre") || l.includes("suite") || l.includes("parentale")) return "#E3F2FD";
  if (l.includes("salle") || l.includes("bain") || l.includes("douche") || l.includes("wc")) return "#F3E5F5";
  if (l.includes("bureau")) return "#E8F5E9";
  if (l.includes("manger") || l.includes("dîner")) return "#FFF8E1";
  if (l.includes("garage")) return "#E0E0E0";
  if (l.includes("terrasse")) return "#FBE9E7";
  if (l.includes("couloir") || l.includes("circulation")) return "#ECEFF1";
  if (l.includes("escalier")) return "#D7CCC8";
  if (l.includes("buanderie")) return "#F1F8E9";
  if (l.includes("invit")) return "#E0F2F1";
  return "#FAFAFA";
}

/** Couleur de contour par type de pièce */
function getRoomStroke(label: string): string {
  const l = label.toLowerCase();
  if (l.includes("salon") || l.includes("séjour")) return "#FFB74D";
  if (l.includes("cuisine")) return "#FFCA28";
  if (l.includes("chambre") || l.includes("suite") || l.includes("parentale")) return "#64B5F6";
  if (l.includes("salle") || l.includes("bain") || l.includes("douche")) return "#CE93D8";
  if (l.includes("bureau")) return "#81C784";
  if (l.includes("manger") || l.includes("dîner")) return "#FFD54F";
  if (l.includes("garage")) return "#9E9E9E";
  if (l.includes("terrasse")) return "#FFAB91";
  if (l.includes("couloir") || l.includes("circulation")) return "#B0BEC5";
  if (l.includes("escalier")) return "#A1887F";
  if (l.includes("buanderie")) return "#C5E1A5";
  if (l.includes("invit")) return "#80CBC4";
  return "#E0E0E0";
}

/**
 * Calcule la bounding box des pièces pour centrer la caméra.
 */
function computeBounds(rooms: PlanRoom[]) {
  if (!rooms.length) return { center: [0, 0, 0] as [number, number, number], size: 16 };
  let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
  for (const r of rooms) {
    if (r.x < minX) minX = r.x;
    if (r.x + r.width > maxX) maxX = r.x + r.width;
    if (r.y < minZ) minZ = r.y;
    if (r.y + r.height > maxZ) maxZ = r.y + r.height;
  }
  const cx = (minX + maxX) / 2;
  const cz = (minZ + maxZ) / 2;
  const size = Math.max(maxX - minX, maxZ - minZ, 10);
  return { center: [cx, 0, cz] as [number, number, number], size };
}

function Rooms3D({ rooms }: { rooms: PlanRoom[] }) {
  const WALL_HEIGHT = 2.7;

  const sorted = useMemo(
    () => [...rooms].sort((a, b) => (a.x + a.y) - (b.x + b.y)),
    [rooms]
  );

  const bounds = useMemo(() => computeBounds(rooms), [rooms]);

  return (
    <>
      {/* Sol */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[bounds.center[0], -0.01, bounds.center[2]]} receiveShadow>
        <planeGeometry args={[bounds.size * 1.5, bounds.size * 1.5]} />
        <meshStandardMaterial color="#E8EDF5" />
      </mesh>

      {/* Grille */}
      <gridHelper
        args={[bounds.size * 1.2, 12, "#C5D0E8", "#E8EDF5"]}
        position={[bounds.center[0], 0, bounds.center[2]]}
      />

      {/* Pièces */}
      {sorted.map((room, idx) => {
        const cx = room.x + room.width / 2;
        const cz = room.y + room.height / 2;
        const fill = room.fill || getRoomColor(room.label);
        const stroke = getRoomStroke(room.label);

        return (
          <group key={room.id || `room-${idx}`}>
            {/* Sol de la pièce */}
            <mesh position={[cx, 0.01, cz]} receiveShadow>
              <boxGeometry args={[room.width, 0.02, room.height]} />
              <meshStandardMaterial color={fill} />
            </mesh>

            {/* Murs (4 faces) */}
            {/* Mur avant */}
            <mesh position={[cx, WALL_HEIGHT / 2, cz + room.height / 2]} castShadow>
              <boxGeometry args={[room.width, WALL_HEIGHT, 0.05]} />
              <meshStandardMaterial color={stroke} />
            </mesh>
            {/* Mur arrière */}
            <mesh position={[cx, WALL_HEIGHT / 2, cz - room.height / 2]} castShadow>
              <boxGeometry args={[room.width, WALL_HEIGHT, 0.05]} />
              <meshStandardMaterial color={stroke} />
            </mesh>
            {/* Mur gauche */}
            <mesh position={[cx - room.width / 2, WALL_HEIGHT / 2, cz]} castShadow>
              <boxGeometry args={[0.05, WALL_HEIGHT, room.height]} />
              <meshStandardMaterial color={stroke} />
            </mesh>
            {/* Mur droit */}
            <mesh position={[cx + room.width / 2, WALL_HEIGHT / 2, cz]} castShadow>
              <boxGeometry args={[0.05, WALL_HEIGHT, room.height]} />
              <meshStandardMaterial color={stroke} />
            </mesh>

            {/* Label de la pièce */}
            <Text
              position={[cx, WALL_HEIGHT + 0.3, cz]}
              fontSize={0.35}
              color="#0D2B6B"
              anchorX="center"
              anchorY="middle"
              maxWidth={room.width * 0.9}
            >
              {room.label}
            </Text>
          </group>
        );
      })}
    </>
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
  plan,
}: Plan3DProps) {
  const rawRooms = plan?.rooms;
  // PlanEngine calcule les pièces dans un système "pixels" (échelle du canvas 2D),
  // pas en mètres réels — on convertit à l'échelle en utilisant la surface réelle connue.
  const ZONE_W = 720;
  const ZONE_H = 390;
  const rooms = rawRooms && plan?.totalBuiltAreaM2
    ? (() => {
        const scale = Math.sqrt(plan.totalBuiltAreaM2 / (ZONE_W * ZONE_H));
        return rawRooms.map((r) => ({
          ...r,
          x: r.x * scale,
          y: r.y * scale,
          width: r.width * scale,
          height: r.height * scale,
        }));
      })()
    : rawRooms;
  // Si plan fourni avec des pièces, on utilise les données dynamiques
  if (plan && rooms && rooms.length > 0) {
    const bounds = computeBounds(rooms);
    const camDist = Math.max(bounds.size * 1.1, 12);
    return (
      <div className="w-full">
        <div className="w-full max-w-[400px] h-[400px] mx-auto border-2 border-white/20 rounded-xl overflow-hidden">
          <ErrorBoundary fallback={<ThreeDErrorFallback />}>
            <Canvas
              camera={{ position: [camDist, camDist * 0.7, camDist], fov: 45 }}
              shadows
            >
              <ambientLight intensity={0.5} />
              <directionalLight
                position={[15, 20, 10]}
                intensity={0.8}
                castShadow
                shadow-mapSize-width={1024}
                shadow-mapSize-height={1024}
              />
              <hemisphereLight args={["#EAF2FF", "#FFF2E8", 0.4]} />

              <Rooms3D rooms={rooms} />

              <OrbitControls
                enableZoom={true}
                enablePan={true}
                autoRotate
                autoRotateSpeed={0.8}
                target={bounds.center}
              />
            </Canvas>
          </ErrorBoundary>
        </div>

        <div className="text-center text-sm text-white/60 mt-3">
          <p>Surface: {surface}m² | {plan.estimatedRooms} pièces | {etages} étage{etages > 1 ? 's' : ''}</p>
          <p>{chambres} chambre{chambres > 1 ? 's' : ''} • {sallesDeBain} salle{sallesDeBain > 1 ? 's' : ''} de bain</p>
        </div>
      </div>
    );
  }

  // Fallback : aucune donnée plan → état vide
  return <PlanEmptyState />;
}
