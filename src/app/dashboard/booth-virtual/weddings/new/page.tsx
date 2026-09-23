"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { uploadToCloudinary } from "@/lib/uploadClient";
import DatePicker from "@/components/DatePicker";
import Spinner from "@/components/Spinner";
import BackButton from "@/components/BackButton";
import WeddingLandingPreview from "@/components/WeddingLandingPreview";
import CoverPhotoEditor, { CoverAdjust } from "../CoverPhotoEditor";
import CustomListbox from "../CustomListbox";
import FontSizeStepper from "../FontSizeStepper";
import FontFamilyPicker from "../FontFamilyPicker";
import ThemePicker from "../ThemePicker";
import NameOrderToggle from "../NameOrderToggle";

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
  const [titleFontFamily, setTitleFontFamily] = useState("cormorant");
  const [nameOrder, setNameOrder] = useState<"GROOM_FIRST" | "BRIDE_FIRST">("GROOM_FIRST");
  const [theme, setTheme] = useState<"BURGUNDY" | "SKY_BLUE">("BURGUNDY");
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
          titleFontFamily,
          nameOrder,
          theme,
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
              <CustomListbox
                value={packageId}
                onChange={setPackageId}
                placeholder="Pilih paket"
                options={packages.map((p) => ({
                  value: p.id,
                  label: p.name,
                  description: `${
                    p.mediaMode === "PHOTO_AND_VIDEO"
                      ? "Foto & Pesan Video"
                      : p.mediaMode === "PHOTO_AND_VOICE"
                      ? "Foto & Voice Note"
                      : "Foto saja"
                  } · Akses ${p.accessDurationDays} hari · Rp${p.price.toLocaleString("id-ID")}`,
                }))}
              />
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
              <label className="field-label">Urutan Nama</label>
              <NameOrderToggle
                value={nameOrder}
                onChange={setNameOrder}
                groomName={groomName}
                brideName={brideName}
              />
            </div>

            <div>
              <label className="field-label">
                Ukuran Font Nama Pengantin
              </label>
              <FontSizeStepper scale={titleFontScale} onChange={setTitleFontScale} />
            </div>

            <div>
              <label className="field-label">Gaya Font Nama Pengantin</label>
              <FontFamilyPicker value={titleFontFamily} onChange={setTitleFontFamily} />
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

            <div>
              <label className="field-label">Tema Warna Booth &amp; Slideshow</label>
              <ThemePicker value={theme} onChange={setTheme} />
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
              nameOrder={nameOrder}
              eventDateLabel={eventDateLabel}
              welcomeText={welcomeText}
              coverImageUrl={cover.url}
              coverPosX={cover.posX}
              coverPosY={cover.posY}
              coverScale={cover.scale}
              titleFontScale={titleFontScale}
              titleFontFamily={titleFontFamily}
              theme={theme}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
