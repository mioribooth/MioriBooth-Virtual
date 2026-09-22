"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { uploadToCloudinary } from "@/lib/uploadClient";
import CustomSelect from "@/components/CustomSelect";
import DatePicker from "@/components/DatePicker";
import Spinner from "@/components/Spinner";
import BackButton from "@/components/BackButton";
import WeddingLandingPreview from "@/components/WeddingLandingPreview";
import CoverPhotoEditor, { CoverAdjust } from "../CoverPhotoEditor";

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
  const [clientPhone, setClientPhone] = useState("");
  const [clientAddress, setClientAddress] = useState("");
  const [welcomeText, setWelcomeText] = useState("");
  const [cover, setCover] = useState<CoverAdjust>({ url: null, posX: 50, posY: 50, scale: 1 });
  const [titleFontScale, setTitleFontScale] = useState(1);
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

  async function handleCoverUpload(file: File) {
    const result = await uploadToCloudinary(file, "image", "booth-virtual/covers");
    return result.secure_url;
  }

  const eventDateLabel = eventDate
    ? new Date(eventDate).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })
    : "";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!eventDate) {
      setError("Tanggal acara wajib diisi");
      return;
    }
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
          coverImageUrl: cover.url,
          coverImagePosX: cover.posX,
          coverImagePosY: cover.posY,
          coverImageScale: cover.scale,
          titleFontScale,
          welcomeText: welcomeText || undefined,
          clientPhone: clientPhone || undefined,
          clientAddress: clientAddress || undefined,
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
      <div className="admin-container" style={{ maxWidth: 960 }}>
        <BackButton href="/dashboard/booth-virtual/weddings" label="Semua wedding" />

        <span className="eyebrow" style={{ display: "block", marginTop: 16 }}>
          Wedding Baru
        </span>
        <h1 className="font-display" style={{ marginBottom: 20 }}>
          Buat Booth Virtual Baru
        </h1>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 1fr) 300px",
            gap: 28,
            alignItems: "start",
          }}
          className="wedding-form-layout"
        >
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
              <DatePicker value={eventDate} onChange={setEventDate} placeholder="Pilih tanggal acara" />
            </div>
            <div>
              <label className="field-label">Paket</label>
              <CustomSelect value={packageId} onChange={setPackageId} required>
                {packages.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} —{" "}
                    {p.mediaMode === "PHOTO_AND_VIDEO"
                      ? "Foto & Pesan Video"
                      : p.mediaMode === "PHOTO_AND_VOICE"
                      ? "Foto & Voice Note"
                      : "Foto saja"}{" "}
                    · Akses{" "}
                    {p.accessDurationDays} hari · Rp{p.price.toLocaleString("id-ID")}
                  </option>
                ))}
              </CustomSelect>
            </div>

            <div style={{ borderTop: "1px solid var(--color-cream-200)", paddingTop: 16 }}>
              <span className="eyebrow" style={{ display: "block", marginBottom: 12 }}>
                Data Client
              </span>
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div>
                  <label className="field-label">Nomor WhatsApp Client</label>
                  <input
                    className="field-input"
                    type="tel"
                    inputMode="tel"
                    placeholder="0812xxxxxxxx"
                    value={clientPhone}
                    onChange={(e) => setClientPhone(e.target.value)}
                  />
                </div>
                <div>
                  <label className="field-label">Alamat / Lokasi Venue</label>
                  <textarea
                    className="field-input"
                    rows={2}
                    placeholder="Nama gedung/venue, kota"
                    value={clientAddress}
                    onChange={(e) => setClientAddress(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div style={{ borderTop: "1px solid var(--color-cream-200)", paddingTop: 16 }}>
              <label className="field-label">Foto Cover Pengantin</label>
              <CoverPhotoEditor value={cover} onChange={setCover} onUpload={handleCoverUpload} />
            </div>

            <div>
              <label className="field-label">
                Ukuran Font Nama Pengantin{" "}
                <span className="muted" style={{ fontWeight: 400 }}>
                  ({Math.round(titleFontScale * 100)}%)
                </span>
              </label>
              <input
                type="range"
                min={0.7}
                max={1.8}
                step={0.05}
                value={titleFontScale}
                onChange={(e) => setTitleFontScale(Number(e.target.value))}
                style={{ width: "100%" }}
              />
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
              {saving ? (
                <>
                  <Spinner /> Menyimpan...
                </>
              ) : (
                "Buat Wedding"
              )}
            </button>
          </form>

          <div style={{ position: "sticky", top: 24 }} className="wedding-form-preview">
            <WeddingLandingPreview
              groomName={groomName}
              brideName={brideName}
              eventDateLabel={eventDateLabel}
              welcomeText={welcomeText}
              coverImageUrl={cover.url}
              coverPosX={cover.posX}
              coverPosY={cover.posY}
              coverScale={cover.scale}
              titleFontScale={titleFontScale}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
