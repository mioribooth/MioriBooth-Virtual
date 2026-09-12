"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import FilmstripSteps from "@/components/FilmstripSteps";
import Spinner from "@/components/Spinner";
import { IconFlipCamera, IconCheck, IconRefresh } from "@/components/icons";
import { getBoothToken, getSession, patchSession } from "@/lib/wizardClient";
import { uploadToCloudinary } from "@/lib/uploadClient";
import "../capture.css";

type SlotState =
  | { status: "empty" }
  | { status: "captured"; previewUrl: string; url: string; uploading: boolean };

// Rasio viewfinder mengikuti jumlah slot di frame: frame 2-slot pakai foto
// 1:1, frame 3-slot pakai foto 16:9 (landscape) — sesuai desain frame yang
// dipakai. Untuk 3-slot, preview kamera otomatis jadi kotak landscape supaya
// tamu foto dengan komposisi landscape TANPA perlu memutar fisik HP-nya
// (HP tetap dalam kunci layar potrait seperti biasa).
function getCameraAspect(slotCount: number | null): { css: string; ratio: number } {
  if (slotCount === 2) return { css: "1 / 1", ratio: 1 };
  if (slotCount === 3) return { css: "16 / 9", ratio: 16 / 9 };
  return { css: "3 / 4", ratio: 3 / 4 };
}

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
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");
  const [totalSteps, setTotalSteps] = useState(6);
  const countdownTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const token = getBoothToken(slug);

  // Ambil slotCount dari sesi — dan kalau sebelumnya udah pernah ambil foto
  // (rawPhotoUrls sudah ada di sesi, misal tamu balik lagi dari halaman cek
  // hasil buat retake), pulihkan sebagai slot yang sudah terisi, jangan reset
  // semuanya jadi kosong.
  useEffect(() => {
    if (!token) return;
    getSession(token).then((session) => {
      const count = session?.slotCount ?? 3;
      setSlotCount(count);
      const existingUrls: string[] = session?.rawPhotoUrls ?? [];
      setSlots(
        Array.from({ length: count }, (_, i) => {
          const url = existingUrls[i];
          return url
            ? { status: "captured" as const, previewUrl: url, url, uploading: false }
            : { status: "empty" as const };
        })
      );
      setActiveSlot(existingUrls.length < count ? existingUrls.length : 0);
    });
  }, [token]);

  // Jumlah step di filmstrip beda tergantung paket wedding-nya (ada rekam suara/video atau tidak).
  useEffect(() => {
    fetch(`/api/weddings/${slug}`)
      .then((res) => res.json())
      .then((wedding) => setTotalSteps(wedding.mediaMode === "PHOTO_ONLY" ? 5 : 6))
      .catch(() => {});
  }, [slug]);

  // Buka kamera — dependensi ke facingMode supaya bisa switch depan/belakang.
  useEffect(() => {
    let active = true;
    async function startCamera() {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode },
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
        setCameraError(null);
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
  }, [facingMode]);

  function handleFlipCamera() {
    if (countdown !== null || reviewSlot !== null) return;
    setFacingMode((m) => (m === "user" ? "environment" : "user"));
  }

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

    // Crop dulu sesuai rasio target slot (lihat getCameraAspect) dari tengah
    // frame kamera, biar hasil capture persis sama dengan apa yang tamu lihat
    // di viewfinder — bukan cuma preview-nya doang yang landscape/1:1 tapi
    // foto mentahnya tetap rasio kamera aslinya.
    const { ratio: targetAspect } = getCameraAspect(slotCount);
    const videoAspect = video.videoWidth / video.videoHeight;
    let sx: number, sy: number, sWidth: number, sHeight: number;
    if (videoAspect > targetAspect) {
      sHeight = video.videoHeight;
      sWidth = sHeight * targetAspect;
      sx = (video.videoWidth - sWidth) / 2;
      sy = 0;
    } else {
      sWidth = video.videoWidth;
      sHeight = sWidth / targetAspect;
      sx = 0;
      sy = (video.videoHeight - sHeight) / 2;
    }

    const maxWidth = 1280;
    const outputScale = Math.min(1, maxWidth / sWidth);
    canvas.width = sWidth * outputScale;
    canvas.height = sHeight * outputScale;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    // Mirror horizontal cuma untuk kamera depan, supaya hasil sesuai apa yang
    // dilihat tamu di preview (selfie). Kamera belakang tidak perlu di-mirror.
    if (facingMode === "user") {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(video, sx, sy, sWidth, sHeight, 0, 0, canvas.width, canvas.height);

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

  // Urutan sekarang selalu: capture -> cek hasil (review). Rekam suara/video
  // dan animasi cetak dipindah setelah review, jadi di sini tinggal lanjut
  // ke /review tanpa perlu cek mediaMode dulu.
  async function handleFinish() {
    if (!token || !allDone) return;
    setFinishing(true);
    setError(null);
    try {
      const urls = slots.map((s) => (s.status === "captured" ? s.url : "")).filter(Boolean);
      await patchSession(token, { rawPhotoUrls: urls, step: "capture_done" });
      streamRef.current?.getTracks().forEach((t) => t.stop());
      router.push(`/w/${slug}/review`);
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
      <FilmstripSteps total={totalSteps} currentIndex={1} />
      <div className="booth-content">
        <div className="capture-header">
          <span className="eyebrow">Langkah 2</span>
          <h2 className="font-display">Ambil foto terbaikmu</h2>
          <p className="muted">
            {reviewSlot !== null ? "Sudah oke?" : `Slot ${activeSlot + 1} dari ${slotCount ?? "-"}`}
          </p>
        </div>

        <div className="camera-frame" style={{ aspectRatio: getCameraAspect(slotCount).css }}>
          {cameraError ? (
            <div className="camera-error">{cameraError}</div>
          ) : (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="camera-video"
              style={{ transform: facingMode === "user" ? "scaleX(-1)" : "none" }}
            />
          )}

          {!cameraError && reviewSlot === null && (
            <div className="camera-hud">
              <span className="camera-hud-chip">
                <span className="camera-hud-dot" />
                Slot {activeSlot + 1}/{slotCount ?? "-"}
              </span>
              <button
                className="camera-flip-btn"
                onClick={handleFlipCamera}
                type="button"
                aria-label="Ganti kamera depan/belakang"
                disabled={countdown !== null}
              >
                <IconFlipCamera size={19} />
              </button>
            </div>
          )}

          {reviewSlot !== null && (
            <div className="camera-review-overlay">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={reviewShot?.status === "captured" ? reviewShot.previewUrl : ""}
                alt={`Hasil slot ${reviewSlot + 1}`}
                className="camera-video"
                style={{ transform: "none" }}
              />
              {reviewShot?.status === "captured" && reviewShot.uploading && (
                <div className="slot-thumb-uploading">
                  <Spinner />
                </div>
              )}
            </div>
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

          <div className={`camera-frame-actions ${reviewSlot !== null ? "is-review" : "is-idle"}`}>
            {reviewSlot !== null ? (
              <div className="review-action-row">
                <button
                  className="btn btn-secondary"
                  style={{ flex: 1 }}
                  onClick={() => handleRetake(reviewSlot)}
                  type="button"
                >
                  <IconRefresh /> Retake
                </button>
                <button
                  className="btn btn-primary"
                  style={{ flex: 1 }}
                  onClick={handleConfirmShot}
                  disabled={reviewShot?.status === "captured" && reviewShot.uploading}
                  type="button"
                >
                  <IconCheck /> Gunakan
                </button>
              </div>
            ) : (
              <button
                className="shutter-btn"
                onClick={startCountdown}
                disabled={!!cameraError || slots[activeSlot]?.status === "captured" || countdown !== null}
                type="button"
                aria-label="Ambil Foto"
              >
                <span className="shutter-btn-ring" />
              </button>
            )}
          </div>
        </div>
        {reviewSlot === null && (
          <p className="capture-shutter-hint">
            {countdown !== null ? "Bersiap..." : "Ketuk untuk ambil foto"}
          </p>
        )}

        <div className="slot-strip">
          {slots.map((slot, i) => (
            <div key={i} className={`slot-thumb ${i === activeSlot ? "is-active" : ""}`}>
              {slot.status === "captured" ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={slot.previewUrl} alt={`Slot ${i + 1}`} />
                  {slot.uploading && (
                    <div className="slot-thumb-uploading">
                      <Spinner />
                    </div>
                  )}
                  <div className="slot-thumb-actions">
                    <button
                      className="btn btn-ghost"
                      style={{ padding: "6px 10px", fontSize: 12 }}
                      onClick={() => handleRetake(i)}
                      type="button"
                      disabled={countdown !== null}
                    >
                      <IconRefresh size={13} /> Retake
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
            {finishing ? (
              <>
                <Spinner /> Memproses...
              </>
            ) : (
              "Lanjutkan"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
