"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import DeleteFrameButton from "@/components/DeleteFrameButton";
import { IconArrowUp, IconArrowDown } from "@/components/icons";

export type FrameGridItem = {
  id: string;
  name: string;
  type: string;
  slotCount: number;
  previewUrl: string | null;
  overlayImageUrl: string;
};

export default function FrameGrid({
  weddingId,
  initialFrames,
}: {
  weddingId: string;
  initialFrames: FrameGridItem[];
}) {
  const [frames, setFrames] = useState(initialFrames);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function persistOrder(next: FrameGridItem[]) {
    startTransition(async () => {
      try {
        const res = await fetch(`/api/admin/weddings/${weddingId}/frames/reorder`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ frameIds: next.map((f) => f.id) }),
        });
        if (!res.ok) throw new Error();
        setError(null);
      } catch {
        setError("Gagal menyimpan urutan frame, coba lagi.");
      }
    });
  }

  function move(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= frames.length) return;
    const next = [...frames];
    [next[index], next[target]] = [next[target], next[index]];
    // Update tampilan langsung (optimistic) biar kerasa responsif, baru
    // simpan urutan barunya ke server di background.
    setFrames(next);
    persistOrder(next);
  }

  if (frames.length === 0) {
    return <p className="muted">Belum ada frame. Tambahkan frame pertama.</p>;
  }

  return (
    <div>
      {error && (
        <p className="muted" style={{ color: "var(--color-danger)", marginBottom: 10 }}>
          {error}
        </p>
      )}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(160px,1fr))",
          gap: 14,
          marginBottom: 30,
        }}
      >
        {frames.map((f, index) => (
          <div key={f.id} className="card" style={{ position: "relative" }}>
            <DeleteFrameButton weddingId={weddingId} frameId={f.id} frameName={f.name} />

            {/* Tombol urutan (naik/turun) — dipisah dari <Link> editor supaya
                klik-nya gak ikut mentrigger navigasi ke editor frame. */}
            <div className="frame-reorder-controls">
              <button
                type="button"
                className="frame-reorder-btn"
                onClick={() => move(index, -1)}
                disabled={index === 0 || isPending}
                aria-label={`Pindahkan ${f.name} ke atas`}
                title="Pindah ke atas"
              >
                <IconArrowUp size={13} />
              </button>
              <button
                type="button"
                className="frame-reorder-btn"
                onClick={() => move(index, 1)}
                disabled={index === frames.length - 1 || isPending}
                aria-label={`Pindahkan ${f.name} ke bawah`}
                title="Pindah ke bawah"
              >
                <IconArrowDown size={13} />
              </button>
            </div>

            <Link
              href={`/dashboard/booth-virtual/weddings/${weddingId}/frames/${f.id}/editor`}
              style={{ textDecoration: "none", color: "inherit", display: "block" }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={f.previewUrl ?? f.overlayImageUrl}
                alt={f.name}
                style={{
                  width: "100%",
                  aspectRatio: "3/4",
                  objectFit: "cover",
                  borderRadius: 8,
                  marginBottom: 8,
                }}
              />
              <strong style={{ fontSize: 14 }}>{f.name}</strong>
              <div>
                <span className="badge badge-muted">
                  {f.type === "PHOTO" ? `Foto · ${f.slotCount} slot` : "Video · 1 slot"}
                </span>
              </div>
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
