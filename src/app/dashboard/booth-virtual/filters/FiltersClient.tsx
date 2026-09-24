"use client";

import { useEffect, useRef, useState } from "react";
import { uploadToCloudinary } from "@/lib/uploadClient";
import { parseCubeLUT, applyLUTTrilinear, ParsedLUT } from "@/lib/lut";
import BackButton from "@/components/BackButton";
import Spinner from "@/components/Spinner";
import "./filters.css";

interface ColorFilterRow {
  id: string;
  name: string;
  lutFileUrl: string;
  lutSize: number;
}

// Gambar contoh yang digambar sendiri lewat canvas (bukan file eksternal) —
// gradasi warna + swatch simpel yang cukup buat ngasih gambaran efek LUT-nya
// (mirip warna kulit, langit, rerumputan), dipakai buat preview tiap filter.
function drawSampleImage(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const { width, height } = canvas;

  const sky = ctx.createLinearGradient(0, 0, 0, height * 0.55);
  sky.addColorStop(0, "#8fc7e8");
  sky.addColorStop(1, "#eec9a6");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, width, height * 0.55);

  ctx.fillStyle = "#5b8c4a";
  ctx.fillRect(0, height * 0.55, width, height * 0.45);

  // "kulit" buat gambaran warna skin-tone
  ctx.fillStyle = "#dba784";
  ctx.beginPath();
  ctx.ellipse(width * 0.5, height * 0.42, width * 0.16, height * 0.22, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#7a4a30";
  ctx.beginPath();
  ctx.ellipse(width * 0.5, height * 0.26, width * 0.14, height * 0.1, 0, 0, Math.PI * 2);
  ctx.fill();
}

export default function FiltersClient() {
  const [filters, setFilters] = useState<ColorFilterRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [pendingLut, setPendingLut] = useState<{ file: File; parsed: ParsedLUT } | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const originalCanvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    fetch("/api/admin/filters")
      .then((res) => res.json())
      .then(setFilters)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (originalCanvasRef.current) drawSampleImage(originalCanvasRef.current);
  }, []);

  useEffect(() => {
    if (!pendingLut || !previewCanvasRef.current) return;
    const canvas = previewCanvasRef.current;
    drawSampleImage(canvas);
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    applyLUTTrilinear(imageData, pendingLut.parsed);
    ctx.putImageData(imageData, 0, 0);
  }, [pendingLut]);

  async function handleFile(file: File) {
    setError(null);
    if (!file.name.toLowerCase().endsWith(".cube")) {
      setError("File harus berformat .cube");
      return;
    }
    try {
      const text = await file.text();
      const parsed = parseCubeLUT(text);
      setPendingLut({ file, parsed });
      if (!name) setName(file.name.replace(/\.cube$/i, ""));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal membaca file .cube");
    }
  }

  async function handleSave() {
    if (!pendingLut || !name.trim()) {
      setError("Isi nama filter dulu.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const uploaded = await uploadToCloudinary(pendingLut.file, "raw", "booth-virtual/luts");
      const res = await fetch("/api/admin/filters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          lutFileUrl: uploaded.secure_url,
          lutSize: pendingLut.parsed.size,
        }),
      });
      if (!res.ok) throw new Error("Gagal menyimpan filter");
      const created = await res.json();
      setFilters((prev) => [...prev, created]);
      setPendingLut(null);
      setName("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Hapus filter ini? Filter yang sudah dipakai tamu tidak akan berubah.")) return;
    const res = await fetch(`/api/admin/filters/${id}`, { method: "DELETE" });
    if (res.ok) setFilters((prev) => prev.filter((f) => f.id !== id));
  }

  return (
    <div className="admin-container">
        <BackButton href="/dashboard/booth-virtual/weddings" label="Kembali" />
        <span className="eyebrow" style={{ display: "block", marginTop: 16 }}>
          Filter Foto &amp; Video
        </span>
        <h1 className="font-display" style={{ marginBottom: 6 }}>
          Kelola LUT Filter
        </h1>
        <p className="muted" style={{ marginBottom: 24 }}>
          Upload file <code>.cube</code> (3D LUT) hasil color grading kamu sendiri. Filter ini
          akan muncul sebagai pilihan buat tamu di halaman "Pilih Filter", setelah mereka
          ambil foto/video — diterapkan langsung ke hasil akhirnya, frame tidak ikut kena.
        </p>

        <div className="card" style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 16, marginTop: 0 }}>Tambah Filter Baru</h2>
          <div
            className={`lut-dropzone ${isDragOver ? "is-dragover" : ""}`}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragOver(true);
            }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragOver(false);
              const file = e.dataTransfer.files?.[0];
              if (file) handleFile(file);
            }}
            onClick={() => fileInputRef.current?.click()}
          >
            <span className="lut-dropzone-icon">🎞️</span>
            <p>
              <strong>Klik atau seret file .cube ke sini</strong>
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".cube"
              style={{ display: "none" }}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFile(file);
                e.target.value = "";
              }}
            />
          </div>

          {pendingLut && (
            <div className="lut-preview-row">
              <div>
                <p className="muted" style={{ fontSize: 12, marginBottom: 4 }}>Sebelum</p>
                <canvas ref={originalCanvasRef} width={140} height={175} className="lut-preview-canvas" />
              </div>
              <div>
                <p className="muted" style={{ fontSize: 12, marginBottom: 4 }}>Sesudah ({pendingLut.parsed.size}³)</p>
                <canvas ref={previewCanvasRef} width={140} height={175} className="lut-preview-canvas" />
              </div>
              <div style={{ flex: 1, minWidth: 200 }}>
                <label className="field-label">Nama Filter</label>
                <input
                  className="field-input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="mis. Warm Vintage"
                />
                <button
                  className="btn btn-primary"
                  style={{ marginTop: 10 }}
                  onClick={handleSave}
                  disabled={saving}
                  type="button"
                >
                  {saving ? (
                    <>
                      <Spinner /> Menyimpan...
                    </>
                  ) : (
                    "Simpan Filter"
                  )}
                </button>
              </div>
            </div>
          )}

          {error && <p className="muted" style={{ color: "var(--color-danger)", marginTop: 10 }}>{error}</p>}
        </div>

        <h2 style={{ fontSize: 16 }}>Filter Tersimpan ({filters.length})</h2>
        {loading ? (
          <p className="muted">Memuat...</p>
        ) : filters.length === 0 ? (
          <p className="muted">Belum ada filter. Upload file .cube pertama di atas.</p>
        ) : (
          <div className="lut-list">
            {filters.map((f) => (
              <div key={f.id} className="lut-list-item">
                <span>{f.name}</span>
                <span className="muted" style={{ fontSize: 12 }}>{f.lutSize}³</span>
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => handleDelete(f.id)}
                  style={{ marginLeft: "auto" }}
                >
                  Hapus
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
  );
}
