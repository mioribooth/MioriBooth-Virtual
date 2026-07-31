"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { uploadToCloudinary } from "@/lib/uploadClient";

interface Package {
  id: string;
  name: string;
  mediaMode: string;
  accessDurationDays: number;
  price: number;
}

export default function NewWeddingPage() {
  const router = useRouter();
  const [packages, setPackages] = useState<Package[]>([]);
  const [groomName, setGroomName] = useState("");
  const [brideName, setBrideName] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [packageId, setPackageId] = useState("");
  const [welcomeText, setWelcomeText] = useState("");
  const [coverImageUrl, setCoverImageUrl] = useState<string | null>(null);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/packages")
      .then((res) => res.json())
      .then((data: Package[]) => {
        setPackages(data);
        if (data[0]) setPackageId(data[0].id);
      });
  }, []);

  async function handleCoverUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingCover(true);
    try {
      const result = await uploadToCloudinary(file, "image", "booth-virtual/covers");
      setCoverImageUrl(result.secure_url);
    } catch {
      setError("Upload foto cover gagal.");
    } finally {
      setUploadingCover(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/weddings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          groomName,
          brideName,
          eventDate,
          packageId,
          coverImageUrl,
          welcomeText: welcomeText || undefined,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Gagal membuat wedding");
      }
      const wedding = await res.json();
      router.push(`/dashboard/booth-virtual/weddings/${wedding.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
      setSaving(false);
    }
  }

  return (
    <div className="admin-shell">
      <div className="admin-container" style={{ maxWidth: 560 }}>
        <span className="eyebrow">Wedding Baru</span>
        <h1 className="font-display" style={{ marginBottom: 20 }}>
          Buat Booth Virtual Baru
        </h1>

        <form onSubmit={handleSubmit} className="card" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <label className="field-label">Nama Pengantin Pria</label>
            <input
              className="field-input"
              value={groomName}
              onChange={(e) => setGroomName(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="field-label">Nama Pengantin Wanita</label>
            <input
              className="field-input"
              value={brideName}
              onChange={(e) => setBrideName(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="field-label">Tanggal Acara</label>
            <input
              type="date"
              className="field-input"
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="field-label">Paket</label>
            <select
              className="field-input"
              value={packageId}
              onChange={(e) => setPackageId(e.target.value)}
              required
            >
              {packages.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} — {p.mediaMode === "PHOTO_ONLY" ? "Foto saja" : "Foto & Voice note"} · Akses{" "}
                  {p.accessDurationDays} hari · Rp{p.price.toLocaleString("id-ID")}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="field-label">Foto Cover Pengantin</label>
            <input type="file" accept="image/*" onChange={handleCoverUpload} />
            {uploadingCover && <p className="muted">Mengunggah...</p>}
            {coverImageUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={coverImageUrl}
                alt="Preview cover"
                style={{ width: 120, borderRadius: 8, marginTop: 8 }}
              />
            )}
          </div>
          <div>
            <label className="field-label">Teks Sambutan (opsional)</label>
            <textarea
              className="field-input"
              rows={3}
              value={welcomeText}
              onChange={(e) => setWelcomeText(e.target.value)}
              placeholder="Tinggalkan foto dan pesan suara terbaikmu untuk kami kenang selamanya."
            />
          </div>

          {error && <p className="muted" style={{ color: "var(--color-danger)" }}>{error}</p>}

          <button className="btn btn-primary btn-block" type="submit" disabled={saving}>
            {saving ? "Menyimpan..." : "Buat Wedding"}
          </button>
        </form>
      </div>
    </div>
  );
}
