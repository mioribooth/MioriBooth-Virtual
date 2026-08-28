"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { uploadToCloudinary } from "@/lib/uploadClient";
import CustomSelect from "@/components/CustomSelect";
import DatePicker from "@/components/DatePicker";
import Spinner from "@/components/Spinner";
import BackButton from "@/components/BackButton";

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
  welcomeText: string | null;
  clientPhone: string | null;
  clientAddress: string | null;
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
  const [coverImageUrl, setCoverImageUrl] = useState<string | null>(null);
  const [uploadingCover, setUploadingCover] = useState(false);
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
        setCoverImageUrl(wedding.coverImageUrl);
      })
      .catch(() => setError("Gagal memuat data wedding."))
      .finally(() => setLoading(false));
  }, [weddingId]);

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
          coverImageUrl,
          welcomeText: welcomeText || undefined,
          clientPhone: clientPhone || undefined,
          clientAddress: clientAddress || undefined,
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
      <div className="admin-container" style={{ maxWidth: 560 }}>
        <BackButton href={`/dashboard/booth-virtual/weddings/${weddingId}`} label="Kembali" />

        <span className="eyebrow" style={{ display: "block", marginTop: 16 }}>
          Edit Wedding
        </span>
        <h1 className="font-display" style={{ marginBottom: 20 }}>
          {groomName} &amp; {brideName}
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
            <DatePicker value={eventDate} onChange={setEventDate} placeholder="Pilih tanggal acara" />
          </div>
          <div>
            <label className="field-label">Paket</label>
            <CustomSelect value={packageId} onChange={setPackageId} required>
              {packages.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} — {p.mediaMode === "PHOTO_ONLY" ? "Foto saja" : "Foto & Voice note"} · Akses{" "}
                  {p.accessDurationDays} hari · Rp{p.price.toLocaleString("id-ID")}
                </option>
              ))}
            </CustomSelect>
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

          <div>
            <label className="field-label">Foto Cover Pengantin</label>
            <input type="file" accept="image/*" onChange={handleCoverUpload} />
            {uploadingCover && (
              <p className="muted" style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 6 }}>
                <Spinner dark /> Mengunggah...
              </p>
            )}
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
            {saving ? (
              <>
                <Spinner /> Menyimpan...
              </>
            ) : (
              "Simpan Perubahan"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
