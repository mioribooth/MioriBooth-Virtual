"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import "./slideshow.css";

interface SlideItem {
  id: string;
  guestName: string | null;
  mediaType: string; // "PHOTO" | "VIDEO"
  composedUrl: string;
  voiceNoteUrl: string | null;
  createdAt: string;
}

interface GalleryResponse {
  groomName: string;
  brideName: string;
  isExpired: boolean;
  submissions: SlideItem[];
}

const POLL_INTERVAL_MS = 15_000;
const PHOTO_ONLY_DURATION_MS = 6_000; // foto tanpa pesan suara
const PHOTO_WITH_VOICE_MAX_MS = 20_000; // batas atas kalau pesan suara panjang
const VIDEO_MAX_MS = 30_000; // batas atas kalau video panjang

export default function SlideshowClient({ gallerySlug }: { gallerySlug: string }) {
  const [data, setData] = useState<GalleryResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [started, setStarted] = useState(false);
  const [index, setIndex] = useState(0);

  const advanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(`/api/gallery/${gallerySlug}`, { cache: "no-store" });
      if (!res.ok) throw new Error("Galeri tidak ditemukan");
      const json: GalleryResponse = await res.json();
      setData(json);
      setError(null);
    } catch {
      setError("Gagal memuat galeri");
    }
  }, [gallerySlug]);

  useEffect(() => {
    fetchData();
    const poll = setInterval(fetchData, POLL_INTERVAL_MS);
    return () => clearInterval(poll);
  }, [fetchData]);

  const clearAdvanceTimer = () => {
    if (advanceTimer.current) {
      clearTimeout(advanceTimer.current);
      advanceTimer.current = null;
    }
  };

  const goNext = useCallback(() => {
    setIndex((prev) => {
      const total = data?.submissions.length ?? 0;
      if (total === 0) return 0;
      return (prev + 1) % total;
    });
  }, [data?.submissions.length]);

  // Jadwalkan perpindahan slide berikutnya setiap kali slide aktif berubah.
  useEffect(() => {
    if (!started || !data || data.submissions.length === 0) return;
    clearAdvanceTimer();

    const current = data.submissions[index % data.submissions.length];
    if (!current) return;

    if (current.mediaType === "VIDEO") {
      // Perpindahan dipicu oleh event `onEnded` video, ini cuma jaring pengaman.
      advanceTimer.current = setTimeout(goNext, VIDEO_MAX_MS);
    } else if (current.voiceNoteUrl) {
      advanceTimer.current = setTimeout(goNext, PHOTO_WITH_VOICE_MAX_MS);
    } else {
      advanceTimer.current = setTimeout(goNext, PHOTO_ONLY_DURATION_MS);
    }

    return clearAdvanceTimer;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [started, index, data]);

  // Kalau list submission berubah (ada tamu baru / ada yang disembunyikan),
  // usahakan index tetap masuk akal daripada reset ke 0 dan bikin lompatan aneh.
  useEffect(() => {
    if (!data) return;
    setIndex((prev) => (data.submissions.length === 0 ? 0 : prev % data.submissions.length));
  }, [data]);

  function handleStart() {
    setStarted(true);
    const el = document.documentElement;
    if (el.requestFullscreen) {
      el.requestFullscreen().catch(() => {
        /* biarkan kalau browser/OS menolak fullscreen */
      });
    }
  }

  if (error) {
    return (
      <div className="slideshow-shell slideshow-state">
        <h2>{error}</h2>
      </div>
    );
  }

  if (!data) {
    return <div className="slideshow-shell slideshow-state" />;
  }

  if (data.isExpired) {
    return (
      <div className="slideshow-shell slideshow-state">
        <h2>Masa akses galeri sudah berakhir</h2>
      </div>
    );
  }

  if (!started) {
    return (
      <div className="slideshow-shell slideshow-state">
        <span className="eyebrow">Live Slideshow</span>
        <h1 className="font-display">
          {data.groomName} &amp; {data.brideName}
        </h1>
        <p className="muted">
          {data.submissions.length} kenangan siap ditampilkan. Layar ini akan berjalan otomatis
          dan terus memperbarui saat ada tamu baru mengirim foto.
        </p>
        <button type="button" className="btn btn-primary" onClick={handleStart}>
          Mulai Slideshow
        </button>
      </div>
    );
  }

  if (data.submissions.length === 0) {
    return (
      <div className="slideshow-shell slideshow-state">
        <span className="eyebrow">Live Slideshow</span>
        <h1 className="font-display">
          {data.groomName} &amp; {data.brideName}
        </h1>
        <p className="muted">Menunggu kenangan pertama dari tamu…</p>
      </div>
    );
  }

  const current = data.submissions[index % data.submissions.length];
  // Kumpulan foto tamu lain buat lapisan latar belakang — beberapa thumbnail
  // yang melayang (floating) di sekitar foto utama, bukan foto yang lagi
  // tampil supaya ga keliatan dobel.
  const backdropPhotos = data.submissions.filter((s) => s.id !== current.id).slice(0, 10);
  const scatterPositions = [
    { top: "6%", left: "4%" },
    { top: "14%", left: "80%" },
    { top: "32%", left: "2%" },
    { top: "58%", left: "86%" },
    { top: "72%", left: "6%" },
    { top: "80%", left: "70%" },
    { top: "4%", left: "48%" },
    { top: "86%", left: "42%" },
    { top: "42%", left: "92%" },
    { top: "22%", left: "28%" },
  ];

  return (
    <div className="slideshow-shell slideshow-split">
      {/* Kolom kiri: identitas mempelai — layar dimaksudkan untuk monitor landscape */}
      <div className="slideshow-left">
        <div className="slideshow-brand">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/logo-white-2.png" alt="MioriBooth" className="slideshow-logo" />
          <span className="slideshow-app-label">Virtual Photobooth</span>
        </div>
        <div className="slideshow-left-body">
          <span className="eyebrow">Wedding Memories Of</span>
          <h1 className="font-display slideshow-names">
            {data.groomName}
            <span className="slideshow-amp">&amp;</span>
            {data.brideName}
          </h1>
        </div>
        <span className="slideshow-watermark">@mioribooth</span>
      </div>

      {/* Kolom kanan: foto tamu bergantian, meluncur dari kanan ke kiri */}
      <div className="slideshow-right">
        <div className="slideshow-bg" aria-hidden="true">
          {backdropPhotos.map((s, i) => {
            const pos = scatterPositions[i % scatterPositions.length];
            return (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={s.id}
                src={s.composedUrl}
                alt=""
                className="slideshow-bg-item"
                style={{
                  top: pos.top,
                  left: pos.left,
                  animationDelay: `${i * 0.6}s`,
                  animationDuration: `${6 + (i % 3)}s`,
                }}
              />
            );
          })}
        </div>
        <div className="slideshow-tint" aria-hidden="true" />

        <div className="slideshow-photo-wrap">
          {current.mediaType === "VIDEO" ? (
            // eslint-disable-next-line jsx-a11y/media-has-caption
            <video
              key={current.id}
              ref={videoRef}
              src={current.composedUrl}
              className="slideshow-media"
              autoPlay
              playsInline
              onEnded={goNext}
            />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={current.id}
              src={current.composedUrl}
              alt={current.guestName ?? "Tamu"}
              className="slideshow-media"
            />
          )}

          {current.mediaType === "PHOTO" && current.voiceNoteUrl && (
            // eslint-disable-next-line jsx-a11y/media-has-caption
            <audio
              key={current.id + "-audio"}
              ref={audioRef}
              src={current.voiceNoteUrl}
              autoPlay
              onEnded={goNext}
            />
          )}

          <div key={current.id + "-caption"} className="slideshow-caption">
            <span className="slideshow-name">{current.guestName || "Tamu"}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
