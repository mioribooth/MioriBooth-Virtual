"use client";

import { useEffect, useState } from "react";
import "./PrintReveal.css";

/**
 * Animasi "foto keluar dari printer" yang tampil sebelum halaman Cek Hasil
 * sepenuhnya interaktif. Selama proses compose masih berjalan (src null),
 * tampilkan slot printer dengan kertas kosong yang bergetar halus. Begitu
 * composedUrl siap, foto "dicetak keluar" — meluncur turun dari celah
 * printer sambil sedikit oleng lalu mendarat rapi.
 */
export default function PrintReveal({
  src,
  mediaType,
  onImgError,
}: {
  src: string | null;
  mediaType: "PHOTO" | "VIDEO";
  onImgError?: () => void;
}) {
  const [phase, setPhase] = useState<"printing" | "feeding" | "done">("printing");

  useEffect(() => {
    if (src && phase === "printing") {
      const t = setTimeout(() => setPhase("feeding"), 120);
      return () => clearTimeout(t);
    }
  }, [src, phase]);

  useEffect(() => {
    if (phase === "feeding") {
      const t = setTimeout(() => setPhase("done"), 1300);
      return () => clearTimeout(t);
    }
  }, [phase]);

  return (
    <div className="print-reveal">
      <div className={`print-slot ${phase !== "printing" ? "is-fed" : ""}`}>
        <span className="print-slot-led" />
        <span className="print-slot-groove" />
      </div>

      <div className="print-paper-stage">
        {!src && (
          <div className="print-loading-bar">
            <span className="print-loading-bar-fill" />
          </div>
        )}

        {src && mediaType === "PHOTO" && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={src}
            alt="Hasil frame"
            onError={onImgError}
            className={`print-paper ${phase === "feeding" ? "is-feeding" : ""} ${
              phase === "done" ? "is-done" : ""
            }`}
          />
        )}

        {src && mediaType === "VIDEO" && (
          // eslint-disable-next-line jsx-a11y/media-has-caption
          <video
            src={src}
            controls
            className={`print-paper ${phase === "feeding" ? "is-feeding" : ""} ${
              phase === "done" ? "is-done" : ""
            }`}
          />
        )}
      </div>

      {phase !== "done" && (
        <p className="print-reveal-caption">
          {!src ? "Sedang mencetak kenanganmu..." : "Hampir jadi..."}
        </p>
      )}
    </div>
  );
}
