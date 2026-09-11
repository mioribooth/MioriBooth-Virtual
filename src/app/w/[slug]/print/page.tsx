"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import FilmstripSteps from "@/components/FilmstripSteps";
import PrintReveal from "@/components/PrintReveal";
import { getBoothToken, getSession } from "@/lib/wizardClient";
import "./print.css";

interface SubmissionResult {
  composedUrl: string;
  voiceNoteUrl: string | null;
  gallerySlug: string;
}

/**
 * Halaman tersendiri: animasi "kertas keluar dari printer" TERPISAH dari
 * halaman Cek Hasil. Submission (POST /api/submissions) benar-benar
 * dikirim di sini, di belakang layar, selagi animasinya jalan — begitu
 * animasinya selesai DAN datanya sudah didapat, baru lanjut ke halaman
 * Terima Kasih.
 */
export default function PrintPage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const token = getBoothToken(slug);

  const [mediaType, setMediaType] = useState<"PHOTO" | "VIDEO">("PHOTO");
  const [totalSteps, setTotalSteps] = useState(6);
  const [currentIndex, setCurrentIndex] = useState(4);
  const [result, setResult] = useState<SubmissionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const submittedRef = useRef(false);

  useEffect(() => {
    if (!token || submittedRef.current) return;
    submittedRef.current = true;
    (async () => {
      try {
        const [session, weddingRes] = await Promise.all([
          getSession(token),
          fetch(`/api/weddings/${slug}`),
        ]);
        setMediaType(session?.mediaType ?? "PHOTO");
        const wedding = await weddingRes.json().catch(() => null);
        if (wedding?.mediaMode) {
          const isPhotoOnly = wedding.mediaMode === "PHOTO_ONLY";
          setTotalSteps(isPhotoOnly ? 5 : 6);
          setCurrentIndex(isPhotoOnly ? 3 : 4);
        }

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
        setResult({
          composedUrl: data.composedUrl,
          voiceNoteUrl: data.voiceNoteUrl ?? null,
          gallerySlug: data.gallerySlug,
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Terjadi kesalahan");
      }
    })();
  }, [token, slug]);

  function handleRevealed() {
    if (!result) return;
    sessionStorage.setItem(`booth_result_${slug}`, JSON.stringify(result));
    router.push(`/w/${slug}/success`);
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

  if (error) {
    return (
      <div className="booth-shell">
        <div className="state-message">
          <h2>Gagal menyimpan</h2>
          <p className="muted" style={{ marginBottom: 18 }}>
            {error}
          </p>
          <button className="btn btn-primary btn-block" onClick={() => router.push(`/w/${slug}/review`)}>
            Kembali ke Cek Hasil
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="booth-shell print-shell">
      <FilmstripSteps total={totalSteps} currentIndex={currentIndex} />
      <div className="booth-content print-content">
        <span className="eyebrow">Langkah {currentIndex + 1}</span>
        <h2 className="font-display">Mencetak kenanganmu</h2>
        <p className="muted" style={{ marginBottom: 16 }}>
          Tunggu sebentar, ya...
        </p>

        <div className="print-stage">
          <PrintReveal
            src={result?.composedUrl ?? null}
            mediaType={mediaType}
            onRevealed={handleRevealed}
          />
        </div>
      </div>
    </div>
  );
}
