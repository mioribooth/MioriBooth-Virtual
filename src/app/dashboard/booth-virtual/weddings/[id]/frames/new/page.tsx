"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { uploadToCloudinary } from "@/lib/uploadClient";

export default function NewFramePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [name, setName] = useState("");
  const [type, setType] = useState<"PHOTO" | "VIDEO">("PHOTO");
  const [uploaded, setUploaded] = useState<{
    url: string;
    publicId: string;
    width: number;
    height: number;
  } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const result = await uploadToCloudinary(file, "image", "booth-virtual/frames");
      setUploaded({
        url: result.secure_url,
        publicId: result.public_id,
        width: result.width ?? 1000,
        height: result.height ?? 1200,
      });
    } catch {
      setError("Upload gambar frame gagal.");
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!uploaded) {
      setError("Upload gambar frame dulu.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/weddings/${id}/frames`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          type,
          overlayImageUrl: uploaded.url,
          overlayPublicId: uploaded.publicId,
          frameWidth: uploaded.width,
          frameHeight: uploaded.height,
          previewUrl: uploaded.url,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Gagal menyimpan frame");
      }
      const frame = await res.json();
      router.push(`/dashboard/booth-virtual/weddings/${id}/frames/${frame.id}/editor`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
      setSaving(false);
    }
  }

  return (
    <div className="admin-shell">
      <div className="admin-container" style={{ maxWidth: 520 }}>
        <span className="eyebrow">Frame Baru</span>
        <h1 className="font-display" style={{ marginBottom: 20 }}>
          Upload Desain Frame
        </h1>

        <form onSubmit={handleSubmit} className="card" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <label className="field-label">Nama Frame</label>
            <input
              className="field-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Contoh: Lavender Pop"
              required
            />
          </div>

          <div>
            <label className="field-label">Jenis Frame</label>
            <select
              className="field-input"
              value={type}
              onChange={(e) => setType(e.target.value as "PHOTO" | "VIDEO")}
            >
              <option value="PHOTO">Foto (3 slot)</option>
              <option value="VIDEO">Video (1 slot)</option>
            </select>
          </div>

          <div>
            <label className="field-label">
              File Frame (PNG, area transparan untuk tempat foto tamu)
            </label>
            <input type="file" accept="image/png" onChange={handleUpload} />
            {uploading && <p className="muted">Mengunggah...</p>}
            {uploaded && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={uploaded.url}
                alt="Preview frame"
                style={{ width: 140, marginTop: 10, borderRadius: 8 }}
              />
            )}
          </div>

          <p className="muted">
            Setelah disimpan, kamu akan diarahkan ke Frame Editor untuk mengatur posisi slot foto
            secara drag &amp; drop.
          </p>

          {error && <p className="muted" style={{ color: "var(--color-danger)" }}>{error}</p>}

          <button className="btn btn-primary btn-block" type="submit" disabled={saving || !uploaded}>
            {saving ? "Menyimpan..." : "Simpan & Lanjut ke Editor"}
          </button>
        </form>
      </div>
    </div>
  );
}
