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
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number | null>(null);
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
  // Exposure/pencahayaan manual. Live preview di-adjust lewat CSS filter di
  // <video> (murah, instan). Buat hasil REKAMANNYA, dipakai pipeline canvas:
  // tiap frame video digambar ulang ke <canvas> tersembunyi dengan filter
  // brightness yang sama (lihat useEffect drawFrame di bawah), lalu itu
  // canvas-lah yang di-capture jadi stream buat MediaRecorder (bukan stream
  // kamera mentah) — exposureRef dipakai (bukan langsung state `exposure`)
  // supaya loop requestAnimationFrame yang jalan terus-menerus selalu baca
  // nilai paling baru tanpa perlu di-restart tiap slider digeser.
  const [exposure, setExposure] = useState(0);
  const exposureRef = useRef(0);
  const exposureFilter = `brightness(${1 + exposure / 100})`;

  function handleExposureChange(value: number) {
    setExposure(value);
    exposureRef.current = value;
  }

  const token = getBoothToken(slug);
  const secondsLeft = Math.max(0, MAX_DURATION_SECONDS - seconds);

  useEffect(() => {
    fetch(`/api/weddings/${slug}`)
      .then((res) => res.json())
      .then((wedding) => setTotalSteps(wedding.mediaMode === "PHOTO_ONLY" ? 5 : 6))
      .catch(() => {});
  }, [slug]);

  // Loop yang terus-menerus nggambar frame video ke canvas tersembunyi
  // dengan filter exposure diterapkan — jalan dari awal (bukan cuma pas
  // rekam) biar pas tombol rekam ditekan, canvasnya udah "panas" dan siap
  // di-capture jadi stream tanpa nunggu/delay/frame kosong di awal.
  // SENGAJA gak di-mirror di sini (beda sama <video> live preview yang
  // di-mirror lewat CSS) — biar hasil rekaman kamera depan tetap gak
  // ke-mirror, sama kayak behaviour sebelumnya.
  useEffect(() => {
    function drawFrame() {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (video && canvas && video.readyState >= 2 && video.videoWidth > 0) {
        if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
        }
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.filter = `brightness(${1 + exposureRef.current / 100})`;
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        }
      }
      animationFrameRef.current = requestAnimationFrame(drawFrame);
    }
    animationFrameRef.current = requestAnimationFrame(drawFrame);
    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, []);

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

    // Rekam dari CANVAS (yang udah di-drawFrame dengan filter exposure),
    // bukan langsung dari stream mentah kamera — ini yang bikin hasil
    // penyesuaian gelap/terang beneran nempel di file video akhirnya, bukan
    // cuma tampilan preview. canvas.captureStream() cuma punya track video
    // (nggak ada audio), jadi audio-nya diambil manual dari stream mic asli
    // lalu digabung jadi satu MediaStream.
    // Fallback: kalau karena suatu hal canvas belum siap (dimensi masih 0 —
    // harusnya nggak pernah kejadian karena drawFrame udah jalan dari awal),
    // rekam langsung dari stream kamera mentah biar fitur utamanya tetap
    // jalan walau exposure-nya gak ke-bakar.
    const canvas = canvasRef.current;
    const canvasReady = !!canvas && canvas.width > 0 && canvas.height > 0;
    const recordStream = canvasReady
      ? new MediaStream([
          ...canvas!.captureStream(30).getVideoTracks(),
          ...streamRef.current.getAudioTracks(),
        ])
      : streamRef.current;

    // Pilih mimeType yang didukung browser ini. Safari/iOS tidak mendukung
    // webm sama sekali (constructor bisa throw kalau dipaksa), jadi cek dulu
    // satu-satu dan pakai yang pertama didukung.
    const preferredTypes = ["video/mp4", "video/webm;codecs=vp9,opus", "video/webm"];
    const supportedType = preferredTypes.find((t) => MediaRecorder.isTypeSupported(t));

    const recorder = supportedType
      ? new MediaRecorder(recordStream, { mimeType: supportedType })
      : new MediaRecorder(recordStream);

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

        <div className="camera-frame" style={{ aspectRatio: "3 / 4" }}>
          {cameraError ? (
            <div className="camera-error">{cameraError}</div>
          ) : (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="camera-video"
              // Kotak preview sekarang di-set 3/4 (samain sama rasio native
              // yang emang dikasih browser buat stream kamera ini — sudah
              // kebukti gabisa dipaksa 9:16 tanpa over-crop/zoom di device
              // ini). Karena rasio kotak SUDAH sama kayak rasio stream-nya,
              // "cover" di sini aman dipakai lagi (gak akan crop berlebihan
              // kayak sebelumnya waktu kotaknya masih 9:16).
              style={{
                objectFit: "cover",
                background: "black",
                transform: facingMode === "user" ? "scaleX(-1)" : "none",
                filter: exposureFilter,
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
          <canvas ref={canvasRef} style={{ display: "none" }} />
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

          {/* Exposure di sini sekarang beneran ke-bakar ke video hasil
              rekaman (lewat canvas pipeline) — disembunyikan pas lagi rekam
              karena mengatur exposure di tengah rekaman bisa bikin transisi
              kecerahan yang aneh di hasil videonya. */}
          {!cameraError && !recording && !result && (
            <div className="camera-exposure">
              <span className="camera-exposure-icon" aria-hidden="true">
                🌙
              </span>
              <input
                type="range"
                min={-50}
                max={50}
                value={exposure}
                onChange={(e) => handleExposureChange(Number(e.target.value))}
                className="camera-exposure-slider"
                aria-label="Atur kecerahan kamera"
              />
              <span className="camera-exposure-icon" aria-hidden="true">
                ☀️
              </span>
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
