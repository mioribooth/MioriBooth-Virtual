"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import FrameSlotEditor, { SlotBox } from "@/components/FrameSlotEditor";
import { uploadToCloudinary } from "@/lib/uploadClient";

interface FrameData {
  id: string;
  name: string;
  type: "PHOTO" | "VIDEO";
  slotCount: number;
  overlayImageUrl: string;
  frameWidth: number;
  frameHeight: number;
  slotPositions: string;
}

export default function FrameEditorPage() {
  const { id, frameId } = useParams<{ id: string; frameId: string }>();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [frame, setFrame] = useState<FrameData | null>(null);
  const [slots, setSlots] = useState<SlotBox[]>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [replacing, setReplacing] = useState(false);

  useEffect(() => {
    loadFrame();
  }, [id, frameId]);

  function loadFrame() {
    fetch(`/api/admin/weddings/${id}/frames/${frameId}`)
      .then((res) => {
        if (!res.ok) throw new Error("Frame tidak ditemukan");
        return res.json();
      })
      .then((data: FrameData) => {
        setFrame(data);
        setSlots(JSON.parse(data.slotPositions));
      })
      .catch((err) => setError(err.message));
  }

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    setError(null);
    try {
      const res = await fetch(`/api/admin/weddings/${id}/frames/${frameId}/positions`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slotPositions: slots }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Gagal menyimpan posisi");
      }
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setSaving(false);
    }
  }

  function resetToDefault() {
    if (!frame) return;
    const defaults: SlotBox[] =
      frame.slotCount === 1
        ? [{ x: 0.1, y: 0.1, width: 0.8, height: 0.8 }]
        : Array.from({ length: frame.slotCount }).map((_, i) => ({
            x: 0.08,
            y: 0.05 + i * 0.31,
            width: 0.84,
            height: 0.27,
          }));
    setSlots(defaults);
  }

  async function handleReplaceFrame(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setReplacing(true);
    setError(null);
    try {
      const uploaded = await uploadToCloudinary(file, "image", "booth-virtual/frames");
      const res = await fetch(`/api/admin/weddings/${id}/frames/${frameId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          overlayImageUrl: uploaded.secure_url,
          overlayPublicId: uploaded.public_id,
          frameWidth: uploaded.width ?? 1000,
          frameHeight: uploaded.height ?? 1200,
          previewUrl: uploaded.secure_url,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Gagal mengganti frame");
      }
      // Muat ulang data frame supaya aspect ratio & gambar baru ke-refresh di editor.
      loadFrame();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setReplacing(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  if (error && !frame) {
    return (
      <div className="admin-shell">
        <div className="admin-container">
          <p className="muted" style={{ color: "var(--color-danger)" }}>
            {error}
          </p>
        </div>
      </div>
    );
  }

  if (!frame) {
    return (
      <div className="admin-shell">
        <div className="admin-container">
          <p className="muted">Memuat frame...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-shell">
      <div className="admin-container" style={{ maxWidth: 560 }}>
        <button className="muted" onClick={() => router.back()} style={{ background: "none", border: "none", cursor: "pointer", marginBottom: 12, padding: 0 }}>
          ← Kembali
        </button>

        <span className="eyebrow">Frame Editor</span>
        <h1 className="font-display" style={{ marginBottom: 4 }}>
          {frame.name}
        </h1>
        <p className="muted" style={{ marginBottom: 20 }}>
          Geser kotak untuk atur posisi foto tamu, tarik titik emas di pojok untuk ubah ukuran.
        </p>

        <FrameSlotEditor
          imageUrl={frame.overlayImageUrl}
          aspectRatio={frame.frameWidth / frame.frameHeight}
          slots={slots}
          onChange={setSlots}
        />

        <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
          <button className="btn btn-ghost" onClick={resetToDefault} type="button">
            Reset Posisi
          </button>
          <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleSave} disabled={saving}>
            {saving ? "Menyimpan..." : "Simpan Posisi"}
          </button>
        </div>

        {saved && <p className="muted" style={{ color: "var(--color-success)", marginTop: 10 }}>Posisi tersimpan.</p>}
        {error && (
          <p className="muted" style={{ color: "var(--color-danger)", marginTop: 10 }}>
            {error}
          </p>
        )}

        <div style={{ borderTop: "1px solid var(--color-cream-200)", marginTop: 26, paddingTop: 18 }}>
          <span className="field-label">Ganti Gambar Frame</span>
          <p className="muted" style={{ marginBottom: 10 }}>
            Upload PNG baru untuk gantikan desain frame ini (posisi slot yang sudah diatur tetap
            dipakai, cek ulang setelah ganti kalau proporsinya beda).
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png"
            onChange={handleReplaceFrame}
            disabled={replacing}
          />
          {replacing && <p className="muted">Mengunggah frame baru...</p>}
        </div>
      </div>
    </div>
  );
}
