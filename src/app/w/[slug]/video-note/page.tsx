"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import FilmstripSteps from "@/components/FilmstripSteps";
import Spinner from "@/components/Spinner";
import { getBoothToken, patchSession } from "@/lib/wizardClient";
import { uploadToCloudinary } from "@/lib/uploadClient";
import "../capture/capture.css";

const MAX_DURATION_SECONDS = 60;

export default function VideoNotePage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();

  const [phase, setPhase] = useState<"choice" | "record">("choice");

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [cameraError, setCameraError] = useState<string | null>(null);
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [result, setResult] = useState<{ previewUrl: string; url: string; duration: number } | null>(
    null
  );
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [finishing, setFinishing] = useState(false);

  const token = getBoothToken(slug);

  // Kamera baru diminta setelah tamu benar-benar pilih "Ya, Rekam Video" —
  // supaya tamu yang mau skip tidak perlu ditanya izin kamera sama sekali.
  useEffect(() => {
    if (phase !== "record") return;
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
  }, [phase]);

  function startRecording() {
    if (!streamRef.current) return;
    chunksRef.current = [];

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
    const actualMimeType = recorderRef.current?.mimeType || "video/webm";
    const blob = new Blob(chunksRef.current, { type: actualMimeType });
    const previewUrl = URL.createObjectURL(blob);
    const duration = seconds;
    setResult({ previewUrl, url: "", duration });
    setUploading(true);
    try {
      const uploaded = await uploadToCloudinary(blob, "video", "booth-virtual/video-notes");
      setResult({ previewUrl, url: uploaded.secure_url, duration });
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

  function handleSkip() {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    router.push(`/w/${slug}/print`);
  }

  async function handleFinish() {
    if (!token || !result?.url) return;
    setFinishing(true);
    setError(null);
    try {
      await patchSession(token, {
        videoNoteUrl: result.url,
        videoDuration: result.duration,
        step: "video_note_done",
      });
      streamRef.current?.getTracks().forEach((t) => t.stop());
      router.push(`/w/${slug}/print`);
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

  if (phase === "choice") {
    return (
      <div className="booth-shell">
        <FilmstripSteps total={6} currentIndex={3} />
        <div className="booth-content" style={{ justifyContent: "center", textAlign: "center" }}>
          <span className="eyebrow">Langkah 4</span>
          <h2 className="font-display" style={{ margin: "6px 0 10px" }}>
            Mau tinggalkan pesan video?
          </h2>
          <p className="muted" style={{ maxWidth: 320, margin: "0 auto 28px" }}>
            Opsional — rekam ucapan video singkat (maksimal {MAX_DURATION_SECONDS} detik) untuk
            kedua mempelai, atau lewati saja kalau tidak sempat.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, width: "100%" }}>
            <button
              className="btn btn-primary btn-block"
              onClick={() => setPhase("record")}
              type="button"
            >
              Ya, Rekam Video
            </button>
            <button className="btn btn-ghost btn-block" onClick={handleSkip} type="button">
              Lewati
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="booth-shell">
      <FilmstripSteps total={6} currentIndex={3} />
      <div className="booth-content">
        <div className="capture-header">
          <span className="eyebrow">Langkah 4</span>
          <h2 className="font-display">Rekam pesan videomu</h2>
          <p className="muted">Maksimal {MAX_DURATION_SECONDS} detik</p>
        </div>

        <div className="camera-frame">
          {cameraError ? (
            <div className="camera-error">{cameraError}</div>
          ) : (
            <video ref={videoRef} autoPlay playsInline muted className="camera-video" />
          )}
          {result && (
            <div className="camera-review-overlay">
              {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
              <video
                src={result.previewUrl}
                controls
                className="camera-video"
                style={{ transform: "none" }}
              />
            </div>
          )}
          {recording && (
            <div className="record-badge">
              <span className="record-dot" /> {seconds}s
            </div>
          )}

          <div className="camera-frame-actions">
            {!result ? (
              <button
                className="btn btn-primary btn-block"
                onClick={recording ? stopRecording : startRecording}
                disabled={!!cameraError}
              >
                {recording ? "Berhenti Merekam" : "Mulai Rekam"}
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

        {uploading && (
          <p className="muted" style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Spinner dark /> Mengunggah video...
          </p>
        )}
        {error && (
          <p className="muted" style={{ color: "var(--color-danger)" }}>
            {error}
          </p>
        )}

        <div style={{ marginTop: "auto", paddingTop: 20, display: "flex", flexDirection: "column", gap: 10 }}>
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
          {!recording && (
            <button className="btn btn-ghost btn-block" onClick={handleSkip} type="button" disabled={finishing}>
              Lewati
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
