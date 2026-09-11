"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import AudioPlayer from "@/components/AudioPlayer";
import Spinner from "@/components/Spinner";
import { IconDownload, IconGallery, IconSparkle } from "@/components/icons";
import "./success.css";

export default function SuccessPage() {
  const { slug } = useParams<{ slug: string }>();
  const [result, setResult] = useState<{
    composedUrl: string;
    voiceNoteUrl: string | null;
    gallerySlug: string;
  } | null>(null);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    const raw = sessionStorage.getItem(`booth_result_${slug}`);
    if (raw) setResult(JSON.parse(raw));
  }, [slug]);

  // Attribute `download` di <a> (atau trik blob+anchor) sering diabaikan total
  // di in-app browser (WhatsApp, Instagram, dll di iOS) — tombol ditekan tapi
  // unduhan tidak pernah mulai. Web Share API dengan File memicu share-sheet
  // asli HP (ada opsi "Simpan ke Foto"/"Simpan ke Galeri"), ini yang paling
  // konsisten jalan di lingkungan seperti itu. Kalau itu pun tidak didukung,
  // baru fallback ke blob+anchor (jalan di Chrome Android/desktop), dan
  // fallback terakhir cukup arahkan ke gambar aslinya di tab yang sama.
  async function handleDownload() {
    if (!result || downloading) return;
    setDownloading(true);
    try {
      const res = await fetch(result.composedUrl);
      if (!res.ok) throw new Error("fetch gagal");
      const blob = await res.blob();
      const ext = blob.type.includes("png") ? "png" : "jpg";
      const fileName = `miori-booth-${Date.now()}.${ext}`;
      const file = new File([blob], fileName, { type: blob.type || "image/jpeg" });

      if (navigator.canShare?.({ files: [file] })) {
        try {
          await navigator.share({ files: [file] });
          return;
        } catch (shareErr) {
          // Dibatalkan pengguna sendiri — jangan lanjut ke fallback lain.
          if (shareErr instanceof Error && shareErr.name === "AbortError") return;
        }
      }

      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(blobUrl), 4000);
    } catch {
      // Fallback terakhir: buka gambar aslinya di tab yang sama (bukan tab
      // baru) supaya tamu bisa tekan-tahan gambarnya untuk simpan manual.
      window.location.href = result.composedUrl;
    } finally {
      setDownloading(false);
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
        <span className="eyebrow" style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
          <IconSparkle size={13} /> Selesai
        </span>
        <h2 className="font-display">Terima kasih!</h2>
        <p className="muted" style={{ marginBottom: 20 }}>
          Kenanganmu sudah tersimpan untuk kedua mempelai.
        </p>

        <div className="success-preview">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={result.composedUrl} alt="Hasil kenangan" />
        </div>

        {result.voiceNoteUrl && (
          <div style={{ width: "100%", marginBottom: 20 }}>
            <AudioPlayer src={result.voiceNoteUrl} variant="light" />
          </div>
        )}

        <div className="success-actions">
          <button
            type="button"
            className="btn btn-primary btn-block"
            onClick={handleDownload}
            disabled={downloading}
          >
            {downloading ? (
              <>
                <Spinner /> Menyiapkan...
              </>
            ) : (
              <>
                <IconDownload /> Download Hasil
              </>
            )}
          </button>
          <p className="muted" style={{ fontSize: 12, margin: "-4px 0 0" }}>
            Unduhan tidak mulai? Tekan &amp; tahan gambar di atas, lalu pilih
            &quot;Simpan ke Foto/Galeri&quot;.
          </p>
          <a className="btn btn-ghost btn-block" href={`/gallery/${result.gallerySlug}`}>
            <IconGallery /> Lihat Galeri Semua Tamu
          </a>
        </div>
      </div>
    </div>
  );
}
