"use client";

import { useEffect, useState } from "react";

interface GalleryItem {
  id: string;
  guestName: string | null;
  mediaType: string; // "PHOTO" | "VIDEO"
  composedUrl: string;
  voiceNoteUrl: string | null;
}

export default function GalleryLightbox({ submissions }: { submissions: GalleryItem[] }) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const close = () => setActiveIndex(null);
  const showPrev = () =>
    setActiveIndex((i) => (i === null ? null : (i - 1 + submissions.length) % submissions.length));
  const showNext = () =>
    setActiveIndex((i) => (i === null ? null : (i + 1) % submissions.length));

  useEffect(() => {
    if (activeIndex === null) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") close();
      if (e.key === "ArrowLeft") showPrev();
      if (e.key === "ArrowRight") showNext();
    }
    document.addEventListener("keydown", handleKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeIndex]);

  if (submissions.length === 0) {
    return <p className="muted">Belum ada kenangan yang tersimpan.</p>;
  }

  const active = activeIndex !== null ? submissions[activeIndex] : null;

  return (
    <>
      <div className="gallery-grid">
        {submissions.map((s, i) => (
          <button
            key={s.id}
            type="button"
            className="gallery-card gallery-card-button"
            onClick={() => setActiveIndex(i)}
            aria-label={`Buka kenangan dari ${s.guestName || "Tamu"}`}
          >
            {s.mediaType === "PHOTO" ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={s.composedUrl} alt={s.guestName ?? "Tamu"} loading="lazy" decoding="async" />
            ) : (
              <span className="gallery-card-video-thumb">
                {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
                <video src={s.composedUrl} preload="metadata" muted playsInline />
                <span className="gallery-play-badge">▶</span>
              </span>
            )}
            <span className="gallery-card-info">
              <span className="gallery-card-name">{s.guestName || "Tamu"}</span>
            </span>
          </button>
        ))}
      </div>

      {active && (
        <div className="lightbox-backdrop" onClick={close}>
          <button type="button" className="lightbox-close" onClick={close} aria-label="Tutup">
            ✕
          </button>

          {submissions.length > 1 && (
            <>
              <button
                type="button"
                className="lightbox-nav lightbox-nav-prev"
                onClick={(e) => {
                  e.stopPropagation();
                  showPrev();
                }}
                aria-label="Sebelumnya"
              >
                ‹
              </button>
              <button
                type="button"
                className="lightbox-nav lightbox-nav-next"
                onClick={(e) => {
                  e.stopPropagation();
                  showNext();
                }}
                aria-label="Berikutnya"
              >
                ›
              </button>
            </>
          )}

          <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
            {active.mediaType === "PHOTO" ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={active.composedUrl} alt={active.guestName ?? "Tamu"} />
            ) : (
              // eslint-disable-next-line jsx-a11y/media-has-caption
              <video src={active.composedUrl} controls autoPlay playsInline />
            )}
            <div className="lightbox-info">
              <span className="lightbox-name">{active.guestName || "Tamu"}</span>
              {active.voiceNoteUrl && (
                // eslint-disable-next-line jsx-a11y/media-has-caption
                <audio src={active.voiceNoteUrl} controls preload="none" />
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
