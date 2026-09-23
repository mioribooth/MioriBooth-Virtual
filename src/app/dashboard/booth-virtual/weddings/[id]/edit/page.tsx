"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { uploadToCloudinary } from "@/lib/uploadClient";
import DatePicker from "@/components/DatePicker";
import Spinner from "@/components/Spinner";
import BackButton from "@/components/BackButton";
import WeddingLandingPreview from "@/components/WeddingLandingPreview";
import CoverPhotoEditor, { CoverAdjust } from "../../CoverPhotoEditor";
import CustomListbox from "../../CustomListbox";
import FontSizeStepper from "../../FontSizeStepper";
import FontFamilyPicker from "../../FontFamilyPicker";
import ThemePicker from "../../ThemePicker";
import NameOrderToggle from "../../NameOrderToggle";

interface Package {
  id: string;
  name: string;
  mediaMode: string;
  accessDurationDays: number;
  price: number;
}

interface WeddingData {
  id: string;
  groomName: string;
  brideName: string;
  eventDate: string;
  packageId: string;
  coverImageUrl: string | null;
  coverImagePosX: number;
  coverImagePosY: number;
  coverImageScale: number;
  titleFontScale: number;
  titleFontFamily: string;
  nameOrder: string;
  welcomeText: string | null;
  clientPhone: string | null;
  clientAddress: string | null;
  showSlideshowQr: boolean;
  theme: string;
}

export default function EditWeddingPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const weddingId = params.id;

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
  const [showSlideshowQr, setShowSlideshowQr] = useState(true);
  const [theme, setTheme] = useState<"BURGUNDY" | "SKY_BLUE">("BURGUNDY");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/admin/packages").then((res) => res.json()),
      fetch(`/api/admin/weddings/${weddingId}`).then((res) => res.json()),
    ])
      .then(([pkgs, wedding]: [Package[], WeddingData]) => {
        setPackages(pkgs);
        setGroomName(wedding.groomName);
        setBrideName(wedding.brideName);
        setEventDate(wedding.eventDate.slice(0, 10));
        setPackageId(wedding.packageId);
        setClientPhone(wedding.clientPhone ?? "");
        setClientAddress(wedding.clientAddress ?? "");
        setWelcomeText(wedding.welcomeText ?? "");
        setCover({
          url: wedding.coverImageUrl,
          posX: wedding.coverImagePosX,
          posY: wedding.coverImagePosY,
          scale: wedding.coverImageScale,
        });
        setTitleFontScale(wedding.titleFontScale);
        setTitleFontFamily(wedding.titleFontFamily);
        setNameOrder(wedding.nameOrder === "BRIDE_FIRST" ? "BRIDE_FIRST" : "GROOM_FIRST");
        setShowSlideshowQr(wedding.showSlideshowQr);
        setTheme(wedding.theme === "SKY_BLUE" ? "SKY_BLUE" : "BURGUNDY");
      })
      .catch(() => setError("Gagal memuat data wedding."))
      .finally(() => setLoading(false));
  }, [weddingId]);

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
      const res = await fetch(`/api/admin/weddings/${weddingId}`, {
        method: "PATCH",
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
          welcomeText: welcomeText || undefined,
          clientPhone: clientPhone || undefined,
          clientAddress: clientAddress || undefined,
          showSlideshowQr,
          theme,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Gagal menyimpan perubahan");
      }
      router.push(`/dashboard/booth-virtual/weddings/${weddingId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="admin-shell">
        <div className="admin-container">
          <div className="page-loading">
            <div className="page-loading-spinner" />
            <span>Memuat...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-shell">
      <div className="admin-container" style={{ maxWidth: 960 }}>
        <BackButton href={`/dashboard/booth-virtual/weddings/${weddingId}`} label="Kembali" />

        <span className="eyebrow" style={{ display: "block", marginTop: 16 }}>
          Edit Wedding
        </span>
        <h1 className="font-display" style={{ marginBottom: 20 }}>
          {groomName} &amp; {brideName}
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
              <p className="muted" style={{ fontSize: 12, marginTop: 6 }}>
                Mengganti paket atau tanggal acara akan menghitung ulang tanggal akses berakhir.
              </p>
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
              <p className="muted" style={{ fontSize: 12, marginTop: 4 }}>
                Berlaku dari halaman awal booth tamu sampai Live Slideshow.
                Dashboard admin ini tetap burgundy, gak ikut berubah.
              </p>
            </div>

            <div>
              <label
                className="field-label"
                style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}
              >
                <input
                  type="checkbox"
                  checked={showSlideshowQr}
                  onChange={(e) => setShowSlideshowQr(e.target.checked)}
                  style={{ width: 16, height: 16 }}
                />
                Tampilkan ajakan + QR booth di Live Slideshow
              </label>
              <p className="muted" style={{ fontSize: 12, marginTop: 4 }}>
                Kalau dimatikan, kartu "Yuk, cobain juga booth-nya!" beserta QR
                code di layar slideshow venue disembunyikan.
              </p>
            </div>

            {error && <p className="muted" style={{ color: "var(--color-danger)" }}>{error}</p>}

            <button className="btn btn-primary btn-block" type="submit" disabled={saving}>
              {saving ? (
                <>
                  <Spinner /> Menyimpan...
                </>
              ) : (
                "Simpan Perubahan"
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
