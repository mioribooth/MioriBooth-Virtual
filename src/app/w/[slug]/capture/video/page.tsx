"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import FilmstripSteps from "@/components/FilmstripSteps";
import { getBoothToken, patchSession } from "@/lib/wizardClient";
import { uploadToCloudinary } from "@/lib/uploadClient";
import "../capture.css";

const MAX_DURATION_SECONDS = 15;

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
  const [error, setError] = useState<string | null>(null);
  const [finishing, setFinishing] = useState(false);

  const token = getBoothToken(slug);

  useEffect(() => {
    let active = true;
    async function startCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user" },
          audio: true,
        });
        if (!active) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;
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
  }, []);

  function startRecording() {
    if (!streamRef.current) return;
    chunksRef.current = [];
    const recorder = new MediaRecorder(streamRef.current, { mimeType: "video/webm" });
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
    const blob = new Blob(chunksRef.current, { type: "video/webm" });
    const previewUrl = URL.createObjectURL(blob);
    setResult({ previewUrl, url: "" });
    setUploading(true);
    try {
      const uploaded = await uploadToCloudinary(blob, "video", "booth-virtual/raw-videos");
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
  }

  async function handleFinish() {
    if (!token || !result?.url) return;
    setFinishing(true);
    setError(null);
    try {
      await patchSession(token, { rawVideoUrl: result.url, step: "capture_done" });
      streamRef.current?.getTracks().forEach((t) => t.stop());

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
      <FilmstripSteps total={5} currentIndex={1} />
      <div className="booth-content">
        <span className="eyebrow">Langkah 2</span>
        <h2 className="font-display">Rekam video ucapanmu</h2>
        <p className="muted" style={{ marginBottom: 14 }}>
          Maksimal {MAX_DURATION_SECONDS} detik
        </p>

        <div className="camera-frame">
          {cameraError ? (
            <div className="camera-error">{cameraError}</div>
          ) : result ? (
            // eslint-disable-next-line jsx-a11y/media-has-caption
            <video src={result.previewUrl} controls className="camera-video" style={{ transform: "none" }} />
          ) : (
            <video ref={videoRef} autoPlay playsInline muted className="camera-video" />
          )}
          {recording && (
            <div className="record-badge">
              <span className="record-dot" /> {seconds}s
            </div>
          )}
        </div>

        {!result ? (
          <button
            className="btn btn-primary btn-block"
            style={{ marginTop: 16 }}
            onClick={recording ? stopRecording : startRecording}
            disabled={!!cameraError}
          >
            {recording ? "Berhenti Merekam" : "Mulai Rekam"}
          </button>
        ) : (
          <button
            className="btn btn-secondary btn-block"
            style={{ marginTop: 16 }}
            onClick={handleRetake}
            disabled={uploading}
          >
            Rekam Ulang
          </button>
        )}

        {uploading && <p className="muted">Mengunggah video...</p>}
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
            {finishing ? "Memproses..." : "Lanjutkan"}
          </button>
        </div>
      </div>
    </div>
  );
}
