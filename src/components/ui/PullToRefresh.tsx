"use client";

import { useState, useRef, useCallback } from "react";
import { RefreshCw } from "lucide-react";

const THRESHOLD = 70;
const MAX_PULL = 100;

export function PullToRefresh({ children }: { children: React.ReactNode }) {
  const [pull, setPull] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const startY = useRef(0);

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    if (refreshing || window.scrollY > 0) return;
    startY.current = e.clientY;
    setDragging(true);
  }, [refreshing]);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragging || refreshing) return;
    const dy = e.clientY - startY.current;
    if (dy > 0 && window.scrollY === 0) {
      setPull(Math.min(dy, MAX_PULL));
    } else {
      setPull(0);
    }
  }, [dragging, refreshing]);

  const endDrag = useCallback(() => {
    if (!dragging || refreshing) return;
    setDragging(false);
    if (pull > THRESHOLD) {
      setRefreshing(true);
      window.setTimeout(() => window.location.reload(), 400);
    } else {
      setPull(0);
    }
  }, [dragging, refreshing, pull]);

  const rotation = Math.min(pull * 2.5, 360);

  return (
    <div
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      style={{ position: "relative", touchAction: dragging ? "none" : "pan-y" }}
    >
      {(pull > 0 || refreshing) && (
        <div
          style={{
            position: "absolute",
            top: refreshing ? 20 : pull - 44,
            left: "50%",
            transform: "translateX(-50%)",
            opacity: Math.min((refreshing ? 40 : pull) / 40, 1),
            transition: dragging ? "none" : "top 0.25s, opacity 0.25s",
            zIndex: 40,
          }}
        >
          <div className="grid size-11 place-items-center rounded-full bg-gradient-to-b from-[#FF8C00] to-[#CC5500] shadow-lg">
            <RefreshCw
              size={20}
              className={`text-white ${refreshing ? "animate-spin" : ""}`}
              style={!refreshing ? { transform: `rotate(${rotation}deg)` } : undefined}
            />
          </div>
        </div>
      )}
      <div
        style={{
          transform: `translateY(${refreshing ? 56 : pull * 0.6}px)`,
          transition: dragging ? "none" : "transform 0.25s",
        }}
      >
        {children}
      </div>
    </div>
  );
}
