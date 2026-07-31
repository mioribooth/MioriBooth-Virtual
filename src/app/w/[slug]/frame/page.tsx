"use client";

import { useEffect, useState } from "react";
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
  mediaMode: "PHOTO_ONLY" | "PHOTO_AND_VOICE";
  isExpired: boolean;
  frames: FrameOption[];
}

export default function FrameSelectPage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();

  const [wedding, setWedding] = useState<WeddingData | null>(null);
  const [guestName, setGuestName] = useState("");
  const [selectedFrame, setSelectedFrame] = useState<FrameOption | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/weddings/${slug}`)
      .then((res) => res.json())
      .then(setWedding)
      .catch(() => setError("Gagal memuat data"));
  }, [slug]);

  async function handleContinue() {
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

  const totalSteps = wedding.mediaMode === "PHOTO_AND_VOICE" ? 5 : 4;

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

        <div className="frame-grid">
          {wedding.frames.map((frame) => (
            <button
              key={frame.id}
              className={`frame-option ${selectedFrame?.id === frame.id ? "is-selected" : ""}`}
              onClick={() => setSelectedFrame(frame)}
              type="button"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={frame.previewUrl} alt={frame.name} />
              <div className="frame-option-info">
                <span className="frame-option-name">{frame.name}</span>
                <span className="badge badge-muted">
                  {frame.type === "PHOTO" ? `Foto · ${frame.slotCount} slot` : "Video · 1 slot"}
                </span>
              </div>
            </button>
          ))}
        </div>

        {wedding.frames.length === 0 && (
          <p className="muted">Belum ada frame tersedia untuk wedding ini.</p>
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
