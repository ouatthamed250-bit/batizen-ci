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

function computeBounds(rooms: PlanRoom[]) {
  if (!rooms.length) return { center: [0, 0, 0] as [number, number, number], size: 16, minX: 0, maxX: 16, minZ: 0, maxZ: 16 };
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
  return { center: [cx, 0, cz] as [number, number, number], size, minX, maxX, minZ, maxZ };
}

function ExteriorShell({ minX, maxX, minZ, maxZ }: { minX: number; maxX: number; minZ: number; maxZ: number }) {
  const WALL_HEIGHT = 2.85;
  const THICKNESS = 0.15;
  const width = maxX - minX;
  const depth = maxZ - minZ;
  const cx = (minX + maxX) / 2;
  const cz = (minZ + maxZ) / 2;
  const color = "#F5F0E8";

  return (
    <group>
      <mesh position={[cx, WALL_HEIGHT / 2, maxZ]} castShadow>
        <boxGeometry args={[width + THICKNESS, WALL_HEIGHT, THICKNESS]} />
        <meshStandardMaterial color={color} />
      </mesh>
      <mesh position={[cx, WALL_HEIGHT / 2, minZ]} castShadow>
        <boxGeometry args={[width + THICKNESS, WALL_HEIGHT, THICKNESS]} />
        <meshStandardMaterial color={color} />
      </mesh>
      <mesh position={[minX, WALL_HEIGHT / 2, cz]} castShadow>
        <boxGeometry args={[THICKNESS, WALL_HEIGHT, depth + THICKNESS]} />
        <meshStandardMaterial color={color} />
      </mesh>
      <mesh position={[maxX, WALL_HEIGHT / 2, cz]} castShadow>
        <boxGeometry args={[THICKNESS, WALL_HEIGHT, depth + THICKNESS]} />
        <meshStandardMaterial color={color} />
      </mesh>
    </group>
  );
}

function Roof({ minX, maxX, minZ, maxZ, wallHeight }: { minX: number; maxX: number; minZ: number; maxZ: number; wallHeight: number }) {
  const OVERHANG = 0.4;
  const THICKNESS = 0.25;
  const width = maxX - minX + OVERHANG * 2;
  const depth = maxZ - minZ + OVERHANG * 2;
  const cx = (minX + maxX) / 2;
  const cz = (minZ + maxZ) / 2;

  return (
    <mesh position={[cx, wallHeight + THICKNESS / 2, cz]} castShadow receiveShadow>
      <boxGeometry args={[width, THICKNESS, depth]} />
      <meshStandardMaterial color="#F8FAFC" />
    </mesh>
  );
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
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[bounds.center[0], -0.02, bounds.center[2]]} receiveShadow>
        <planeGeometry args={[bounds.size * 1.5, bounds.size * 1.5]} />
        <meshStandardMaterial color="#E8EDF5" />
      </mesh>

      <gridHelper
        args={[bounds.size * 1.2, 12, "#C5D0E8", "#E8EDF5"]}
        position={[bounds.center[0], -0.005, bounds.center[2]]}
      />

      <mesh position={[bounds.center[0], 0, bounds.center[2]]} receiveShadow>
        <boxGeometry args={[bounds.maxX - bounds.minX, 0.05, bounds.maxZ - bounds.minZ]} />
        <meshStandardMaterial color="#DCE3F0" />
      </mesh>

      <ExteriorShell minX={bounds.minX} maxX={bounds.maxX} minZ={bounds.minZ} maxZ={bounds.maxZ} />
      <Roof minX={bounds.minX} maxX={bounds.maxX} minZ={bounds.minZ} maxZ={bounds.maxZ} wallHeight={2.85} />

      {sorted.map((room, idx) => {
        const cx = room.x + room.width / 2;
        const cz = room.y + room.height / 2;
        const fill = room.fill || getRoomColor(room.label);
        const stroke = getRoomStroke(room.label);
        return (
          <group key={room.id || `room-${idx}`}>
            <mesh position={[cx, 0.06, cz]} receiveShadow>
              <boxGeometry args={[room.width - 0.05, 0.02, room.height - 0.05]} />
              <meshStandardMaterial color={fill} />
            </mesh>

            <mesh position={[cx, WALL_HEIGHT / 2, cz + room.height / 2]} castShadow>
              <boxGeometry args={[room.width, WALL_HEIGHT, 0.05]} />
              <meshStandardMaterial color={stroke} transparent opacity={0.85} />
            </mesh>
            <mesh position={[cx, WALL_HEIGHT / 2, cz - room.height / 2]} castShadow>
              <boxGeometry args={[room.width, WALL_HEIGHT, 0.05]} />
              <meshStandardMaterial color={stroke} transparent opacity={0.85} />
            </mesh>
            <mesh position={[cx - room.width / 2, WALL_HEIGHT / 2, cz]} castShadow>
              <boxGeometry args={[0.05, WALL_HEIGHT, room.height]} />
              <meshStandardMaterial color={stroke} transparent opacity={0.85} />
            </mesh>
            <mesh position={[cx + room.width / 2, WALL_HEIGHT / 2, cz]} castShadow>
              <boxGeometry args={[0.05, WALL_HEIGHT, room.height]} />
              <meshStandardMaterial color={stroke} transparent opacity={0.85} />
            </mesh>

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
  return <PlanEmptyState />;
}