"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import FilmstripSteps from "@/components/FilmstripSteps";
import { getBoothToken, getSession } from "@/lib/wizardClient";
import "./review.css";

export default function ReviewPage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const token = getBoothToken(slug);

  const [composedUrl, setComposedUrl] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<"PHOTO" | "VIDEO">("PHOTO");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewFailed, setPreviewFailed] = useState(false);
  useEffect(() => {
    if (!token) return;
    (async () => {
      try {
        const session = await getSession(token);
        setMediaType(session?.mediaType ?? "PHOTO");
        const res = await fetch("/api/compose", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error ?? "Gagal menyusun hasil");
        }
        const data = await res.json();
        setComposedUrl(data.composedUrl);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Terjadi kesalahan");
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  async function handleSave() {
    if (!token) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Gagal menyimpan");
      }
      const data = await res.json();
      sessionStorage.setItem(
        `booth_result_${slug}`,
        JSON.stringify({ composedUrl: data.composedUrl, gallerySlug: data.gallerySlug })
      );
      router.push(`/w/${slug}/success`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
      setSaving(false);
    }
  }

  function handleRetake() {
    router.push(`/w/${slug}/capture/${mediaType === "VIDEO" ? "video" : "photo"}`);
  }

  if (!token) {
    return (
      <div className="booth-shell">
        <div className="state-message">
          <h2>Sesi tidak ditemukan</h2>
          <p className="muted">Silakan scan ulang QR code dari awal.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="booth-shell">
      <FilmstripSteps total={5} currentIndex={3} />
      <div className="booth-content">
        <span className="eyebrow">Langkah 4</span>
        <h2 className="font-display">Cek hasilnya</h2>
        <p className="muted" style={{ marginBottom: 16 }}>
          Pastikan hasilnya sudah sesuai sebelum disimpan.
        </p>

        <div className="review-preview">
          {loading && <p className="muted">Menyusun hasil...</p>}
          {!loading && composedUrl && mediaType === "PHOTO" && !previewFailed && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={composedUrl} alt="Hasil frame" onError={() => setPreviewFailed(true)} />
          )}
          {!loading && composedUrl && mediaType === "VIDEO" && (
            // eslint-disable-next-line jsx-a11y/media-has-caption
            <video src={composedUrl} controls style={{ width: "100%", borderRadius: "var(--radius-md)" }} />
          )}
          {!loading && composedUrl && previewFailed && (
            <div style={{ padding: 16 }}>
              <p className="muted" style={{ color: "var(--color-danger)", marginBottom: 10 }}>
                Gambar gagal dimuat. Kirim link di bawah ini ke admin untuk dicek:
              </p>
              <p style={{ wordBreak: "break-all", fontSize: 12 }}>
                <a href={composedUrl} target="_blank" rel="noreferrer">
                  {composedUrl}
                </a>
              </p>
            </div>
          )}
        </div>

        {error && (
          <p className="muted" style={{ color: "var(--color-danger)" }}>
            {error}
          </p>
        )}

        <div style={{ marginTop: "auto", paddingTop: 20, display: "flex", flexDirection: "column", gap: 10 }}>
          <button
            className="btn btn-primary btn-block"
            onClick={handleSave}
            disabled={!composedUrl || saving}
          >
            {saving ? "Menyimpan..." : "Simpan Kenangan"}
          </button>
          <button
            className="btn btn-secondary btn-block"
            onClick={handleRetake}
            disabled={saving}
            type="button"
          >
            Ambil Ulang
          </button>
        </div>
      </div>
    </div>
  );
}
