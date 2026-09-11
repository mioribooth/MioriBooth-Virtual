"use client";

import { useEffect, useState } from "react";
import "./PrintReveal.css";

/**
 * Animasi "foto keluar dari printer" — halaman tersendiri sebelum Terima
 * Kasih. Selama proses compose masih berjalan (src null), tampilkan slot
 * printer dengan indikator loading. Begitu src siap, foto "dicetak keluar"
 * dari celah slot secara MENDADAK dan patah-patah (stepped), bukan meluncur
 * mulus — biar berasa kayak printer fisik yang narik kertas per-sentakan,
 * bukan animasi CSS yang halus.
 */
export default function PrintReveal({
  src,
  mediaType,
  onImgError,
  onRevealed,
}: {
  src: string | null;
  mediaType: "PHOTO" | "VIDEO";
  onImgError?: () => void;
  onRevealed?: () => void;
}) {
  const [phase, setPhase] = useState<"printing" | "feeding" | "done">("printing");

  useEffect(() => {
    if (src && phase === "printing") {
      const t = setTimeout(() => setPhase("feeding"), 150);
      return () => clearTimeout(t);
    }
  }, [src, phase]);

  useEffect(() => {
    if (phase === "feeding") {
      const t = setTimeout(() => {
        setPhase("done");
        onRevealed?.();
      }, 1350);
      return () => clearTimeout(t);
    }
  }, [phase, onRevealed]);

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
