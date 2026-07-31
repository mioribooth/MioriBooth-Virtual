"use client";

import { useRef, useState } from "react";

export interface SlotBox {
  x: number; // 0..1
  y: number; // 0..1
  width: number; // 0..1
  height: number; // 0..1
}

interface DragState {
  index: number;
  mode: "move" | "resize";
  startClientX: number;
  startClientY: number;
  startBox: SlotBox;
}

const MIN_SIZE = 0.08;

export default function FrameSlotEditor({
  imageUrl,
  aspectRatio,
  slots,
  onChange,
}: {
  imageUrl: string;
  aspectRatio: number; // width / height
  slots: SlotBox[];
  onChange: (slots: SlotBox[]) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<DragState | null>(null);
  const [, forceRender] = useState(0);

  function clamp(v: number, min: number, max: number) {
    return Math.min(Math.max(v, min), max);
  }

  function handlePointerDown(
    e: React.PointerEvent,
    index: number,
    mode: "move" | "resize"
  ) {
    e.preventDefault();
    e.stopPropagation();
    dragRef.current = {
      index,
      mode,
      startClientX: e.clientX,
      startClientY: e.clientY,
      startBox: { ...slots[index] },
    };
    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
  }

  function handlePointerMove(e: PointerEvent) {
    const drag = dragRef.current;
    const container = containerRef.current;
    if (!drag || !container) return;

    const rect = container.getBoundingClientRect();
    const dxFrac = (e.clientX - drag.startClientX) / rect.width;
    const dyFrac = (e.clientY - drag.startClientY) / rect.height;

    const next = [...slots];
    const box = { ...drag.startBox };

    if (drag.mode === "move") {
      box.x = clamp(box.x + dxFrac, 0, 1 - box.width);
      box.y = clamp(box.y + dyFrac, 0, 1 - box.height);
    } else {
      box.width = clamp(box.width + dxFrac, MIN_SIZE, 1 - box.x);
      box.height = clamp(box.height + dyFrac, MIN_SIZE, 1 - box.y);
    }

    next[drag.index] = box;
    onChange(next);
  }

  function handlePointerUp() {
    dragRef.current = null;
    window.removeEventListener("pointermove", handlePointerMove);
    window.removeEventListener("pointerup", handlePointerUp);
    forceRender((v) => v + 1);
  }

  return (
    <div
      ref={containerRef}
      style={{
        position: "relative",
        width: "100%",
        maxWidth: 420,
        aspectRatio: String(aspectRatio),
        margin: "0 auto",
        backgroundImage: `url(${imageUrl})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        borderRadius: 12,
        overflow: "hidden",
        boxShadow: "var(--shadow-soft)",
        touchAction: "none",
      }}
    >
      {slots.map((slot, i) => (
        <div
          key={i}
          onPointerDown={(e) => handlePointerDown(e, i, "move")}
          style={{
            position: "absolute",
            left: `${slot.x * 100}%`,
            top: `${slot.y * 100}%`,
            width: `${slot.width * 100}%`,
            height: `${slot.height * 100}%`,
            border: "2px dashed #fff",
            background: "rgba(107, 31, 43, 0.35)",
            cursor: "move",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "white",
            fontWeight: 700,
            fontSize: 20,
            userSelect: "none",
          }}
        >
          {i + 1}
          <div
            onPointerDown={(e) => handlePointerDown(e, i, "resize")}
            style={{
              position: "absolute",
              right: -6,
              bottom: -6,
              width: 18,
              height: 18,
              borderRadius: "50%",
              background: "var(--color-gold-500)",
              border: "2px solid white",
              cursor: "nwse-resize",
            }}
          />
        </div>
      ))}
    </div>
  );
}
