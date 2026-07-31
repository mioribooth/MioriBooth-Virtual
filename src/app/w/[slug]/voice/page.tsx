"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import FilmstripSteps from "@/components/FilmstripSteps";
import { getBoothToken, patchSession } from "@/lib/wizardClient";
import { uploadToCloudinary } from "@/lib/uploadClient";
import "./voice.css";

export default function VoiceNotePage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();

  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [micError, setMicError] = useState<string | null>(null);
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [result, setResult] = useState<{ previewUrl: string; url: string; duration: number } | null>(
    null
  );
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [finishing, setFinishing] = useState(false);

  const token = getBoothToken(slug);

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  async function startRecording() {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunksRef.current = [];
      const recorder = new MediaRecorder(stream);
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = handleRecordingStop;
      recorder.start();
      recorderRef.current = recorder;
      setRecording(true);
      setSeconds(0);
      timerRef.current = setInterval(() => setSeconds((p) => p + 1), 1000);
    } catch {
      setMicError("Tidak bisa mengakses mic. Pastikan kamu mengizinkan akses mic di browser.");
    }
  }

  function stopRecording() {
    recorderRef.current?.stop();
    streamRef.current?.getTracks().forEach((t) => t.stop());
    if (timerRef.current) clearInterval(timerRef.current);
    setRecording(false);
  }

  async function handleRecordingStop() {
    const blob = new Blob(chunksRef.current, { type: "audio/webm" });
    const previewUrl = URL.createObjectURL(blob);
    const duration = seconds;
    setResult({ previewUrl, url: "", duration });
    setUploading(true);
    try {
      const uploaded = await uploadToCloudinary(blob, "video", "booth-virtual/voice-notes"); // audio diupload lewat endpoint video di Cloudinary
      setResult({ previewUrl, url: uploaded.secure_url, duration });
    } catch {
      setError("Upload pesan suara gagal, coba rekam ulang.");
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
      await patchSession(token, {
        voiceNoteUrl: result.url,
        voiceDuration: result.duration,
        step: "voice_done",
      });
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
      <FilmstripSteps total={5} currentIndex={2} />
      <div className="booth-content">
        <span className="eyebrow">Langkah 3</span>
        <h2 className="font-display">Tinggalkan pesan suara</h2>
        <p className="muted" style={{ marginBottom: 30 }}>
          Ucapkan doa atau harapan terbaikmu untuk kedua mempelai.
        </p>

        <div className="voice-panel">
          {micError && <p className="muted" style={{ color: "var(--color-danger)" }}>{micError}</p>}

          {!result ? (
            <>
              <div className="voice-timer">
                {String(Math.floor(seconds / 60)).padStart(2, "0")}:
                {String(seconds % 60).padStart(2, "0")}
              </div>
              <div className={`voice-bars ${recording ? "is-recording" : ""}`}>
                {Array.from({ length: 18 }).map((_, i) => (
                  <span key={i} style={{ animationDelay: `${i * 0.06}s` }} />
                ))}
              </div>
              <button
                className={`mic-button ${recording ? "is-recording" : ""}`}
                onClick={recording ? stopRecording : startRecording}
                type="button"
                aria-label={recording ? "Berhenti merekam" : "Mulai merekam"}
              >
                {recording ? "■" : "●"}
              </button>
              <p className="muted">{recording ? "Ketuk untuk berhenti" : "Ketuk untuk mulai rekam"}</p>
            </>
          ) : (
            <>
              {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
              <audio src={result.previewUrl} controls style={{ width: "100%", marginBottom: 14 }} />
              <button className="btn btn-secondary btn-block" onClick={handleRetake} disabled={uploading}>
                Rekam Ulang
              </button>
            </>
          )}

          {uploading && <p className="muted">Mengunggah pesan suara...</p>}
          {error && (
            <p className="muted" style={{ color: "var(--color-danger)" }}>
              {error}
            </p>
          )}
        </div>

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
