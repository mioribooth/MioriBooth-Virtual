"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import "./success.css";

export default function SuccessPage() {
  const { slug } = useParams<{ slug: string }>();
  const [result, setResult] = useState<{ composedUrl: string; gallerySlug: string } | null>(null);
  const [shareSupported, setShareSupported] = useState(false);

  useEffect(() => {
    const raw = sessionStorage.getItem(`booth_result_${slug}`);
    if (raw) setResult(JSON.parse(raw));
    setShareSupported(typeof navigator !== "undefined" && !!navigator.share);
  }, [slug]);

  async function handleShare() {
    if (!result) return;
    try {
      if (navigator.share) {
        await navigator.share({
          title: "Kenangan Pernikahan",
          text: "Lihat kenangan yang aku tinggalkan lewat Miori Booth!",
          url: result.composedUrl,
        });
      }
    } catch {
      // dibatalkan pengguna, biarkan saja
    }
  }

  if (!result) {
    return (
      <div className="booth-shell">
        <div className="state-message">
          <h2>Hasil tidak ditemukan</h2>
          <p className="muted">Sesi mungkin sudah berakhir. Silakan scan ulang QR code.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="booth-shell success-shell">
      <div className="booth-content success-content">
        <span className="eyebrow">Selesai</span>
        <h2 className="font-display">Terima kasih!</h2>
        <p className="muted" style={{ marginBottom: 20 }}>
          Kenanganmu sudah tersimpan untuk kedua mempelai.
        </p>

        <div className="success-preview">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={result.composedUrl} alt="Hasil kenangan" />
        </div>

        <div className="success-actions">
          <a className="btn btn-primary btn-block" href={result.composedUrl} download>
            Download Hasil
          </a>
          {shareSupported && (
            <button className="btn btn-secondary btn-block" onClick={handleShare}>
              Bagikan ke Media Sosial
            </button>
          )}
          <a className="btn btn-ghost btn-block" href={`/gallery/${result.gallerySlug}`}>
            Lihat Galeri Semua Tamu
          </a>
        </div>
      </div>
    </div>
  );
}
