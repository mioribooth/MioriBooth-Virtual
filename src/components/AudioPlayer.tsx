"use client";

import { useEffect, useRef, useState } from "react";
import "./AudioPlayer.css";

/**
 * Player audio custom — menggantikan <audio controls> bawaan browser yang
 * tampilannya beda-beda tiap browser/OS (dan di sebagian browser mobile
 * malah tampil sangat minim). Elemen <audio> aslinya tetap dipakai di
 * belakang layar (disembunyikan) untuk playback-nya, UI-nya kita gambar sendiri.
 */
export default function AudioPlayer({
  src,
  variant = "light",
}: {
  src: string;
  /** "light" untuk di atas kartu putih, "dark" untuk di atas lightbox gelap. */
  variant?: "light" | "dark";
}) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onLoaded = () => {
      setDuration(audio.duration || 0);
      setLoaded(true);
    };
    const onTime = () => setCurrentTime(audio.currentTime);
    const onEnd = () => {
      setPlaying(false);
      setCurrentTime(0);
    };

    audio.addEventListener("loadedmetadata", onLoaded);
    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("ended", onEnd);
    return () => {
      audio.removeEventListener("loadedmetadata", onLoaded);
      audio.removeEventListener("timeupdate", onTime);
      audio.removeEventListener("ended", onEnd);
    };
  }, [src]);

  function toggle() {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      audio.pause();
      setPlaying(false);
    } else {
      audio.play();
      setPlaying(true);
    }
  }

  function seek(e: React.MouseEvent<HTMLDivElement>) {
    const audio = audioRef.current;
    if (!audio || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
    audio.currentTime = ratio * duration;
    setCurrentTime(audio.currentTime);
  }

  function fmt(s: number) {
    if (!isFinite(s) || s < 0) s = 0;
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  }

  const progress = duration ? Math.min(100, (currentTime / duration) * 100) : 0;

  return (
    <div className={`audio-player audio-player-${variant}`}>
      {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
      <audio ref={audioRef} src={src} preload="metadata" style={{ display: "none" }} />
      <button
        type="button"
        className="audio-player-btn"
        onClick={toggle}
        disabled={!loaded}
        aria-label={playing ? "Jeda" : "Putar pesan suara"}
      >
        {playing ? (
          <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
            <rect x="3" y="2" width="4" height="12" rx="1" />
            <rect x="9" y="2" width="4" height="12" rx="1" />
          </svg>
        ) : (
          <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
            <path d="M4 2.5v11l9-5.5-9-5.5z" />
          </svg>
        )}
      </button>

      <div className="audio-player-track" onClick={seek} role="presentation">
        <div className="audio-player-progress" style={{ width: `${progress}%` }} />
        <div className="audio-player-knob" style={{ left: `${progress}%` }} />
      </div>

      <span className="audio-player-time">
        {fmt(currentTime)} / {fmt(duration)}
      </span>
    </div>
  );
}
