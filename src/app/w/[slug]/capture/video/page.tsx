"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import FilmstripSteps from "@/components/FilmstripSteps";
import Spinner from "@/components/Spinner";
import { IconFlipCamera } from "@/components/icons";
import { getBoothToken, patchSession } from "@/lib/wizardClient";
import { uploadToCloudinaryWithProgress } from "@/lib/uploadClient";
import "../capture.css";

const MAX_DURATION_SECONDS = 60;

export default function CaptureVideoPage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [cameraError, setCameraError] = useState<string | null>(null);
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [result, setResult] = useState<{ previewUrl: string; url: string } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [finishing, setFinishing] = useState(false);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");
  const [totalSteps, setTotalSteps] = useState(6);

  const token = getBoothToken(slug);
  const secondsLeft = Math.max(0, MAX_DURATION_SECONDS - seconds);

  useEffect(() => {
    fetch(`/api/weddings/${slug}`)
      .then((res) => res.json())
      .then((wedding) => setTotalSteps(wedding.mediaMode === "PHOTO_ONLY" ? 5 : 6))
      .catch(() => {});
  }, [slug]);

  useEffect(() => {
    let active = true;
    async function startCamera() {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          // Gak minta width/height/aspectRatio spesifik sama sekali —
          // sudah dicoba portrait (1080x1920) dan landscape (1280x720),
          // dua-duanya bikin browser/kamera crop digital paksa ke tengah
          // (hasilnya nge-zoom cuma ke wajah, bukan FOV natural). Biarkan
          // kamera kasih resolusi default aslinya; object-fit: cover di
          // CSS/style yang urus biar keisi penuh kotak viewfinder, dengan
          // crop merata dari CSS (bukan crop paksa dari constraint kamera).
          video: { facingMode },
          audio: true,
        });
        if (!active) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;
        setCameraError(null);
      } catch {
        setCameraError(
          "Tidak bisa mengakses kamera/mic. Pastikan kamu mengizinkan akses di browser."
        );
      }
    }
    startCamera();
    return () => {
      active = false;
      streamRef.current?.getTracks().forEach((t) => t.stop());
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [facingMode]);

  function handleFlipCamera() {
    if (recording || result) return;
    setFacingMode((m) => (m === "user" ? "environment" : "user"));
  }

  function startRecording() {
    if (!streamRef.current) return;
    chunksRef.current = [];

    // Pilih mimeType yang didukung browser ini. Safari/iOS tidak mendukung
    // webm sama sekali (constructor bisa throw kalau dipaksa), jadi cek dulu
    // satu-satu dan pakai yang pertama didukung.
    const preferredTypes = ["video/mp4", "video/webm;codecs=vp9,opus", "video/webm"];
    const supportedType = preferredTypes.find((t) => MediaRecorder.isTypeSupported(t));

    const recorder = supportedType
      ? new MediaRecorder(streamRef.current, { mimeType: supportedType })
      : new MediaRecorder(streamRef.current);

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };
    recorder.onstop = handleRecordingStop;
    recorder.start();
    recorderRef.current = recorder;
    setRecording(true);
    setSeconds(0);
    timerRef.current = setInterval(() => {
      setSeconds((prev) => {
        if (prev + 1 >= MAX_DURATION_SECONDS) {
          stopRecording();
        }
        return prev + 1;
      });
    }, 1000);
  }

  function stopRecording() {
    recorderRef.current?.stop();
    if (timerRef.current) clearInterval(timerRef.current);
    setRecording(false);
  }

  async function handleRecordingStop() {
    // Pakai mimeType ASLI dari recorder, bukan hardcode, supaya preview lokal
    // konsisten dengan data yang benar-benar direkam browser ini.
    const actualMimeType = recorderRef.current?.mimeType || "video/webm";
    const blob = new Blob(chunksRef.current, { type: actualMimeType });
    const previewUrl = URL.createObjectURL(blob);
    setResult({ previewUrl, url: "" });
    setUploading(true);
    setUploadProgress(0);
    try {
      const uploaded = await uploadToCloudinaryWithProgress(
        blob,
        "video",
        "booth-virtual/raw-videos",
        setUploadProgress
      );
      setResult({ previewUrl, url: uploaded.secure_url });
    } catch {
      setError("Upload video gagal, coba rekam ulang.");
      setResult(null);
    } finally {
      setUploading(false);
    }
  }

  function handleRetake() {
    setResult(null);
    setSeconds(0);
    setUploadProgress(0);
  }

  // Urutan sekarang selalu: capture -> cek hasil (review). Rekam suara dan
  // animasi cetak dipindah setelah review.
  async function handleFinish() {
    if (!token || !result?.url) return;
    setFinishing(true);
    setError(null);
    try {
      await patchSession(token, { rawVideoUrl: result.url, step: "capture_done" });
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
          <h2 className="font-display">Rekam video ucapanmu</h2>
          <p className="muted">Maksimal {MAX_DURATION_SECONDS} detik</p>
        </div>

        <div className="camera-frame" style={{ aspectRatio: "9 / 16" }}>
          {cameraError ? (
            <div className="camera-error">{cameraError}</div>
          ) : (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="camera-video"
              // object-fit: contain (BUKAN cover). Ini poin pentingnya: yang
              // sebenarnya bikin preview kelihatan "ke-zoom kek ratio foto"
              // itu bukan soal resolusi yang diminta ke kamera, tapi "cover"
              // yang maksa stream itu (apa pun rasio aslinya) di-crop biar
              // penuh ngisi kotak 9:16 yang tinggi banget — makin beda jauh
              // rasio aslinya dari 9:16, makin parah crop/zoom-nya.
              // Dengan "contain", frame APA ADANYA dari kamera ditampilin utuh
              // (gak dicrop/dizoom), sama seperti preview mode Video di
              // kamera bawaan HP (yang juga dikasih letterbox, bukan full
              //9:16 tanpa crop). Video yang KEREKAM juga ambil langsung dari
              // stream mentah ini (bukan dari tampilan CSS-nya), jadi ini
              // sekalian bikin preview WYSIWYG — apa yang kelihatan di layar
              // = persis apa yang bakal ke-rekam.
              style={{
                objectFit: "contain",
                background: "black",
                transform: facingMode === "user" ? "scaleX(-1)" : "none",
              }}
            />
          )}
          {result && (
            <div className="camera-review-overlay">
              {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
              <video
                src={result.previewUrl}
                controls
                className="camera-video"
                style={{ transform: "none", objectFit: "contain", background: "black" }}
              />
            </div>
          )}
          {recording && (
            <div className="record-badge">
              <span className="record-dot" /> REC · sisa {secondsLeft}d
            </div>
          )}

          {!cameraError && !recording && !result && (
            <div className="camera-hud">
              <span />
              <button
                className="camera-flip-btn"
                onClick={handleFlipCamera}
                type="button"
                aria-label="Ganti kamera depan/belakang"
              >
                <IconFlipCamera size={19} />
              </button>
            </div>
          )}

          <div className="camera-frame-actions">
            {!result ? (
              <button
                className={`video-record-btn ${recording ? "is-recording" : ""}`}
                onClick={recording ? stopRecording : startRecording}
                disabled={!!cameraError}
                type="button"
                aria-label={recording ? "Berhenti merekam" : "Mulai merekam"}
              >
                {recording ? (
                  <span className="video-record-btn-stop" />
                ) : (
                  <span className="video-record-btn-dot" />
                )}
              </button>
            ) : (
              <button
                className="btn btn-secondary btn-block"
                onClick={handleRetake}
                disabled={uploading}
              >
                Rekam Ulang
              </button>
            )}
          </div>
        </div>
        {!result && (
          <p className="capture-shutter-hint">
            {recording ? "Ketuk untuk berhenti" : "Ketuk untuk mulai rekam"}
          </p>
        )}

        {uploading && (
          <div className="upload-progress" style={{ marginTop: 12 }}>
            <div className="upload-progress-track">
              <div className="upload-progress-fill" style={{ width: `${uploadProgress}%` }} />
            </div>
            <span className="upload-progress-label">Mengunggah video... {uploadProgress}%</span>
          </div>
        )}
        {error && (
          <p className="muted" style={{ color: "var(--color-danger)" }}>
            {error}
          </p>
        )}

        <div style={{ marginTop: "auto", paddingTop: 20 }}>
          <button
            className="btn btn-primary btn-block"
            onClick={handleFinish}
            disabled={!result?.url || finishing}
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
