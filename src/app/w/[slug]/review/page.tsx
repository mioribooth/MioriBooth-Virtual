"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import FilmstripSteps from "@/components/FilmstripSteps";
import Spinner from "@/components/Spinner";
import { IconCheck, IconRefresh } from "@/components/icons";
import { getBoothToken, getSession } from "@/lib/wizardClient";
import "./review.css";

export default function ReviewPage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const token = getBoothToken(slug);

  const [composedUrl, setComposedUrl] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<"PHOTO" | "VIDEO">("PHOTO");
  const [mediaMode, setMediaMode] = useState<"PHOTO_ONLY" | "PHOTO_AND_VOICE" | "PHOTO_AND_VIDEO">(
    "PHOTO_ONLY"
  );
  const [totalSteps, setTotalSteps] = useState(6);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [previewFailed, setPreviewFailed] = useState(false);

  useEffect(() => {
    if (!token) return;
    (async () => {
      try {
        const [session, weddingRes] = await Promise.all([
          getSession(token),
          fetch(`/api/weddings/${slug}`),
        ]);
        setMediaType(session?.mediaType ?? "PHOTO");
        const wedding = await weddingRes.json().catch(() => null);
        if (wedding?.mediaMode) {
          setMediaMode(wedding.mediaMode);
          setTotalSteps(wedding.mediaMode === "PHOTO_ONLY" ? 5 : 6);
        }
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
  }, [token, slug]);

  // Simpan Kenangan sekarang tidak langsung save ke server — tergantung
  // paketnya, tamu masih perlu lanjut rekam suara/video dulu. Baru di
  // halaman animasi cetak (setelah itu semua) submission-nya benar-benar
  // dikirim ke server.
  function handleContinue() {
    if (!composedUrl) return;
    if (mediaMode === "PHOTO_AND_VOICE") {
      router.push(`/w/${slug}/voice`);
    } else if (mediaMode === "PHOTO_AND_VIDEO") {
      router.push(`/w/${slug}/video-note`);
    } else {
      router.push(`/w/${slug}/print`);
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
      <FilmstripSteps total={totalSteps} currentIndex={2} />
      <div className="booth-content">
        <span className="eyebrow">Langkah 3</span>
        <h2 className="font-display">Cek hasilnya</h2>
        <p className="muted" style={{ marginBottom: 16 }}>
          Pastikan hasilnya sudah sesuai sebelum lanjut.
        </p>

        <div className="review-preview">
          {loading && (
            <div className="review-loading">
              <Spinner dark />
            </div>
          )}

          {!loading && composedUrl && !previewFailed && mediaType === "PHOTO" && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={composedUrl} alt="Hasil frame" onError={() => setPreviewFailed(true)} />
          )}

          {!loading && composedUrl && mediaType === "VIDEO" && (
            // eslint-disable-next-line jsx-a11y/media-has-caption
            <video src={composedUrl} controls />
          )}

          {!loading && composedUrl && previewFailed && (
            <div className="review-error-card">
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
            onClick={handleContinue}
            disabled={!composedUrl}
          >
            <IconCheck /> Simpan Kenangan
          </button>
          <button
            className="btn btn-secondary btn-block"
            onClick={handleRetake}
            type="button"
          >
            <IconRefresh /> Ambil Ulang
          </button>
        </div>
      </div>
    </div>
  );
}
