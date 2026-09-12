"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import FilmstripSteps from "@/components/FilmstripSteps";
import { getBoothToken, patchSession } from "@/lib/wizardClient";
import "./frame.css";

interface FrameOption {
  id: string;
  name: string;
  type: "PHOTO" | "VIDEO";
  slotCount: number;
  previewUrl: string;
}

interface WeddingData {
  groomName: string;
  brideName: string;
  mediaMode: "PHOTO_ONLY" | "PHOTO_AND_VOICE" | "PHOTO_AND_VIDEO";
  isExpired: boolean;
  frames: FrameOption[];
}

export default function FrameSelectPage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();

  const [wedding, setWedding] = useState<WeddingData | null>(null);
  const [guestName, setGuestName] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const carouselRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    fetch(`/api/weddings/${slug}`)
      .then((res) => res.json())
      .then(setWedding)
      .catch(() => setError("Gagal memuat data"));
  }, [slug]);

  // Selalu jalan berdasarkan posisi scroll SEKARANG (bukan closure lama),
  // supaya update-nya presisi walau dipanggil dari banyak rAF berturut-turut.
  const updateScales = useCallback(() => {
    const container = carouselRef.current;
    if (!container) return 0;
    const containerCenter = container.scrollLeft + container.clientWidth / 2;
    let closestIndex = 0;
    let closestDist = Infinity;
    itemRefs.current.forEach((el, i) => {
      if (!el) return;
      const itemCenter = el.offsetLeft + el.clientWidth / 2;
      const dist = Math.abs(itemCenter - containerCenter);
      const maxDist = container.clientWidth / 2 + el.clientWidth / 2;
      const t = Math.min(1, dist / Math.max(maxDist, 1));
      const scale = 1 - t * 0.3;
      const opacity = 1 - t * 0.6;
      el.style.transform = `scale(${scale})`;
      el.style.opacity = String(opacity);
      if (dist < closestDist) {
        closestDist = dist;
        closestIndex = i;
      }
    });
    return closestIndex;
  }, []);

  function handleScroll() {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      const idx = updateScales();
      setSelectedIndex(idx);
    });
  }

  // Posisikan & skala kartu begitu daftar frame sudah ada.
  useEffect(() => {
    if (!wedding || wedding.frames.length === 0) return;
    const t = setTimeout(() => updateScales(), 50);
    return () => clearTimeout(t);
  }, [wedding, updateScales]);

  function scrollToIndex(i: number) {
    const el = itemRefs.current[i];
    el?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  }

  async function handleContinue() {
    const selectedFrame = wedding?.frames[selectedIndex];
    if (!selectedFrame) {
      setError("Pilih frame dulu, ya.");
      return;
    }
    const token = getBoothToken(slug);
    if (!token) {
      setError("Sesi tidak ditemukan. Silakan scan ulang QR code.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await patchSession(token, {
        frameId: selectedFrame.id,
        mediaType: selectedFrame.type,
        slotCount: selectedFrame.slotCount,
        guestName: guestName.trim() || undefined,
        step: "frame_selected",
      });
      const dest =
        selectedFrame.type === "PHOTO"
          ? `/w/${slug}/capture/photo`
          : `/w/${slug}/capture/video`;
      router.push(dest);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
      setSubmitting(false);
    }
  }

  if (error && !wedding) {
    return (
      <div className="booth-shell">
        <div className="state-message">
          <h2>Ups</h2>
          <p className="muted">{error}</p>
        </div>
      </div>
    );
  }

  if (!wedding) {
    return (
      <div className="booth-shell">
        <div className="state-message muted">Memuat frame...</div>
      </div>
    );
  }

  const totalSteps = wedding.mediaMode === "PHOTO_ONLY" ? 5 : 6;
  const selectedFrame = wedding.frames[selectedIndex];

  return (
    <div className="booth-shell">
      <FilmstripSteps total={totalSteps} currentIndex={0} />
      <div className="booth-content">
        <span className="eyebrow">Langkah 1</span>
        <h2 className="font-display">Pilih frame favoritmu</h2>
        <p className="muted" style={{ marginBottom: 18 }}>
          Untuk {wedding.groomName} &amp; {wedding.brideName}
        </p>

        <label className="field-label" htmlFor="guestName">
          Nama kamu (opsional)
        </label>
        <input
          id="guestName"
          className="field-input"
          placeholder="Tulis nama kamu"
          value={guestName}
          onChange={(e) => setGuestName(e.target.value)}
          style={{ marginBottom: 22 }}
        />

        {wedding.frames.length === 0 ? (
          <p className="muted">Belum ada frame tersedia untuk wedding ini.</p>
        ) : (
          <>
            <div className="frame-carousel" ref={carouselRef} onScroll={handleScroll}>
              {wedding.frames.map((frame, i) => (
                <div
                  key={frame.id}
                  className="frame-carousel-item"
                  ref={(el) => {
                    itemRefs.current[i] = el;
                  }}
                >
                  <button
                    className={`frame-option ${i === selectedIndex ? "is-selected" : ""}`}
                    onClick={() => scrollToIndex(i)}
                    type="button"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={frame.previewUrl} alt={frame.name} />
                  </button>
                </div>
              ))}
            </div>

            {selectedFrame && (
              <div className="frame-selected-info">
                <span className="frame-option-name">{selectedFrame.name}</span>
                <span className="badge badge-muted">
                  {selectedFrame.type === "PHOTO"
                    ? `Foto · ${selectedFrame.slotCount} slot`
                    : "Video · 1 slot"}
                </span>
              </div>
            )}
            <p className="muted frame-swipe-hint">Geser kiri/kanan untuk lihat pilihan lain</p>
          </>
        )}

        {error && (
          <p className="muted" style={{ color: "var(--color-danger)" }}>
            {error}
          </p>
        )}

        <div style={{ marginTop: "auto", paddingTop: 24 }}>
          <button
            className="btn btn-primary btn-block"
            onClick={handleContinue}
            disabled={submitting || !selectedFrame}
          >
            {submitting ? "Memproses..." : "Lanjutkan"}
          </button>
        </div>
      </div>
    </div>
  );
}
