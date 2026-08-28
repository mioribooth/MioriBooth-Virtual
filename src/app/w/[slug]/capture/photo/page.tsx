"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import FilmstripSteps from "@/components/FilmstripSteps";
import { getBoothToken, getSession, patchSession } from "@/lib/wizardClient";
import { uploadToCloudinary } from "@/lib/uploadClient";
import "../capture.css";

type SlotState =
  | { status: "empty" }
  | { status: "captured"; previewUrl: string; url: string; uploading: boolean };

export default function CapturePhotoPage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [slotCount, setSlotCount] = useState<number | null>(null);
  const [slots, setSlots] = useState<SlotState[]>([]);
  const [activeSlot, setActiveSlot] = useState(0);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [finishing, setFinishing] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [flash, setFlash] = useState(false);
  const [reviewSlot, setReviewSlot] = useState<number | null>(null);
  const countdownTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const token = getBoothToken(slug);

  // Ambil slotCount dari sesi
  useEffect(() => {
    if (!token) return;
    getSession(token).then((session) => {
      const count = session?.slotCount ?? 3;
      setSlotCount(count);
      setSlots(Array.from({ length: count }, () => ({ status: "empty" as const })));
    });
  }, [token]);

  // Buka kamera
  useEffect(() => {
    let active = true;
    async function startCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user" },
          audio: false,
        });
        if (!active) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch {
        setCameraError(
          "Tidak bisa mengakses kamera. Pastikan kamu mengizinkan akses kamera di browser."
        );
      }
    }
    startCamera();
    return () => {
      active = false;
      streamRef.current?.getTracks().forEach((t) => t.stop());
      if (countdownTimerRef.current) clearTimeout(countdownTimerRef.current);
    };
  }, []);

  // Countdown 3-2-1 sebelum kamera otomatis jepret — biar kerasa seperti photobooth fisik.
  function startCountdown() {
    if (countdown !== null || reviewSlot !== null || slots[activeSlot]?.status === "captured" || cameraError) return;
    let n = 3;
    setCountdown(n);
    const tick = () => {
      countdownTimerRef.current = setTimeout(() => {
        n -= 1;
        if (n <= 0) {
          setCountdown(null);
          handleCapture();
        } else {
          setCountdown(n);
          tick();
        }
      }, 800);
    };
    tick();
  }

  async function handleCapture() {
    if (!videoRef.current || !canvasRef.current || !token) return;
    const slotIndex = activeSlot;
    setFlash(true);
    setTimeout(() => setFlash(false), 180);
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const maxWidth = 1280;
    const scale = Math.min(1, maxWidth / video.videoWidth);
    canvas.width = video.videoWidth * scale;
    canvas.height = video.videoHeight * scale;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    // Mirror horizontal supaya hasil sesuai apa yang dilihat tamu di preview (selfie).
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(
      async (blob) => {
        if (!blob) return;
        const previewUrl = URL.createObjectURL(blob);
        setSlots((prev) => {
          const next = [...prev];
          next[slotIndex] = { status: "captured", previewUrl, url: "", uploading: true };
          return next;
        });
        setReviewSlot(slotIndex);
        try {
          const result = await uploadToCloudinary(blob, "image", "booth-virtual/raw-photos");
          setSlots((prev) => {
            const next = [...prev];
            next[slotIndex] = {
              status: "captured",
              previewUrl,
              url: result.secure_url,
              uploading: false,
            };
            return next;
          });
        } catch {
          setError("Upload foto gagal, coba ambil ulang.");
          setSlots((prev) => {
            const next = [...prev];
            next[slotIndex] = { status: "empty" };
            return next;
          });
          setReviewSlot(null);
        }
      },
      "image/jpeg",
      0.9
    );
  }

  // Tamu konfirmasi hasil foto oke, baru lanjut ke slot kosong berikutnya.
  function handleConfirmShot() {
    if (reviewSlot === null) return;
    setSlots((prev) => {
      const nextEmpty = prev.findIndex((s) => s.status === "empty");
      if (nextEmpty !== -1) setActiveSlot(nextEmpty);
      return prev;
    });
    setReviewSlot(null);
  }

  function handleRetake(index: number) {
    setSlots((prev) => {
      const next = [...prev];
      next[index] = { status: "empty" };
      return next;
    });
    setActiveSlot(index);
    setReviewSlot(null);
  }

  const allDone =
    slots.length > 0 &&
    slots.every((s) => s.status === "captured" && !s.uploading);
  const reviewShot = reviewSlot !== null ? slots[reviewSlot] : null;

  async function handleFinish() {
    if (!token || !allDone) return;
    setFinishing(true);
    setError(null);
    try {
      const urls = slots.map((s) => (s.status === "captured" ? s.url : "")).filter(Boolean);
      const session = await patchSession(token, { rawPhotoUrls: urls, step: "capture_done" });
      streamRef.current?.getTracks().forEach((t) => t.stop());

      // Cek mediaMode wedding untuk tahu lanjut ke voice atau langsung review.
      const weddingRes = await fetch(`/api/weddings/${slug}`);
      const wedding = await weddingRes.json();
      if (wedding.mediaMode === "PHOTO_AND_VOICE") {
        router.push(`/w/${slug}/voice`);
      } else {
        router.push(`/w/${slug}/review`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
      setFinishing(false);
    }
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

  return (
    <div className="booth-shell">
      <FilmstripSteps total={slotCount && slotCount > 0 ? 5 : 4} currentIndex={1} />
      <div className="booth-content">
        <span className="eyebrow">Langkah 2</span>
        <h2 className="font-display">Ambil foto terbaikmu</h2>
        <p className="muted" style={{ marginBottom: 14 }}>
          {reviewSlot !== null ? "Sudah oke?" : `Slot ${activeSlot + 1} dari ${slotCount ?? "-"}`}
        </p>

        <div className="camera-frame">
          {reviewSlot !== null ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={reviewShot?.status === "captured" ? reviewShot.previewUrl : ""}
                alt={`Hasil slot ${reviewSlot + 1}`}
                className="camera-video"
                style={{ transform: "none" }}
              />
              {reviewShot?.status === "captured" && reviewShot.uploading && (
                <div className="slot-thumb-uploading" style={{ fontSize: 13 }}>
                  Mengunggah...
                </div>
              )}
            </>
          ) : cameraError ? (
            <div className="camera-error">{cameraError}</div>
          ) : (
            <video ref={videoRef} autoPlay playsInline muted className="camera-video" />
          )}
          <canvas ref={canvasRef} style={{ display: "none" }} />
          {countdown !== null && (
            <div className="countdown-overlay">
              <span key={countdown} className="countdown-number">
                {countdown}
              </span>
            </div>
          )}
          {flash && <div className="capture-flash" />}
        </div>

        {reviewSlot !== null ? (
          <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
            <button
              className="btn btn-secondary"
              style={{ flex: 1 }}
              onClick={() => handleRetake(reviewSlot)}
              type="button"
            >
              Ambil Ulang
            </button>
            <button
              className="btn btn-primary"
              style={{ flex: 1 }}
              onClick={handleConfirmShot}
              disabled={reviewShot?.status === "captured" && reviewShot.uploading}
              type="button"
            >
              Gunakan Foto Ini
            </button>
          </div>
        ) : (
          <button
            className="btn btn-primary btn-block"
            style={{ marginTop: 16 }}
            onClick={startCountdown}
            disabled={!!cameraError || slots[activeSlot]?.status === "captured" || countdown !== null}
          >
            {countdown !== null ? "Bersiap..." : "Ambil Foto"}
          </button>
        )}

        <div className="slot-strip">
          {slots.map((slot, i) => (
            <div key={i} className={`slot-thumb ${i === activeSlot ? "is-active" : ""}`}>
              {slot.status === "captured" ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={slot.previewUrl} alt={`Slot ${i + 1}`} />
                  {slot.uploading && <div className="slot-thumb-uploading">Mengunggah...</div>}
                  <div className="slot-thumb-actions">
                    <button
                      className="btn btn-ghost"
                      style={{ padding: "6px 10px", fontSize: 12 }}
                      onClick={() => handleRetake(i)}
                      type="button"
                      disabled={countdown !== null}
                    >
                      Ambil Ulang
                    </button>
                  </div>
                </>
              ) : (
                <button
                  className="slot-thumb-empty"
                  onClick={() => setActiveSlot(i)}
                  type="button"
                  disabled={countdown !== null}
                >
                  {i + 1}
                </button>
              )}
            </div>
          ))}
        </div>

        {error && (
          <p className="muted" style={{ color: "var(--color-danger)" }}>
            {error}
          </p>
        )}

        <div style={{ marginTop: "auto", paddingTop: 20 }}>
          <button
            className="btn btn-primary btn-block"
            onClick={handleFinish}
            disabled={!allDone || finishing}
          >
            {finishing ? "Memproses..." : "Lanjutkan"}
          </button>
        </div>
      </div>
    </div>
  );
}
