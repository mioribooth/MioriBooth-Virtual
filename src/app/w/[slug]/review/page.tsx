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
  // Video hasil compose butuh waktu buka metadata/frame pertamanya sendiri
  // (terpisah dari loading compose di atas) — selama itu belum siap, tampilkan
  // animasi loading di atas video, bukan kotak kosong nunggu tombol play dipencet.
  const [videoReady, setVideoReady] = useState(false);

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
          // Kalau yang direkam tamu videonya sendiri (frame tipe VIDEO), langkah
          // rekam suara/video tambahan dilewati apapun setting mediaMode wedding-nya
          // — jadi total step-nya selalu 5 (frame, capture, review, print, selesai).
          const isVideoCapture = (session?.mediaType ?? "PHOTO") === "VIDEO";
          setTotalSteps(isVideoCapture || wedding.mediaMode === "PHOTO_ONLY" ? 5 : 6);
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
        setVideoReady(false);
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
  // dikirim ke server. Kalau media yang direkam tamu SENDIRI sudah berupa
  // video (frame tipe VIDEO), langkah rekam suara/video tambahan dilewati —
  // gak masuk akal nambah rekaman lagi di atas video yang udah ada.
  function handleContinue() {
    if (!composedUrl) return;
    if (mediaType === "VIDEO") {
      router.push(`/w/${slug}/print`);
    } else if (mediaMode === "PHOTO_AND_VOICE") {
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

          {!loading && composedUrl && !previewFailed && mediaType === "VIDEO" && (
            <div className="review-video-wrap">
              {!videoReady && (
                <div className="review-loading review-video-loading">
                  <Spinner dark />
                </div>
              )}
              {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
              <video
                src={composedUrl}
                controls
                preload="auto"
                playsInline
                style={{ opacity: videoReady ? 1 : 0 }}
                onLoadedData={() => setVideoReady(true)}
                onError={() => setPreviewFailed(true)}
              />
            </div>
          )}

          {!loading && composedUrl && previewFailed && (
            <div className="review-error-card">
              <p className="muted" style={{ color: "var(--color-danger)", marginBottom: 10 }}>
                Hasil gagal dimuat. Kirim link di bawah ini ke admin untuk dicek:
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

        <div className="review-actions-row">
          <button
            className="btn btn-secondary"
            onClick={handleRetake}
            type="button"
          >
            <IconRefresh size={15} /> Ambil Ulang
          </button>
          <button
            className="btn btn-primary"
            onClick={handleContinue}
            disabled={!composedUrl}
          >
            <IconCheck size={15} /> Simpan Kenangan
          </button>
        </div>
      </div>
    </div>
  );
}
