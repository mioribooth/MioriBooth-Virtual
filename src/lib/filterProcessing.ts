import { ParsedLUT, applyLUTTrilinear, applyLUTNearest, loadImage } from "./lut";

/**
 * Terapkan LUT ke SATU foto (resolusi penuh, bukan thumbnail) dan balikin
 * blob JPEG hasilnya. Dipakai trilinear (akurat) karena ini cuma proses
 * sekali per foto, gak real-time, jadi gapapa lebih berat dikit.
 */
export async function applyFilterToImage(url: string, lut: ParsedLUT): Promise<Blob> {
  const img = await loadImage(url);
  const canvas = document.createElement("canvas");
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas tidak didukung");
  ctx.drawImage(img, 0, 0);
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  applyLUTTrilinear(imageData, lut);
  ctx.putImageData(imageData, 0, 0);

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Gagal memproses foto"))),
      "image/jpeg",
      0.92
    );
  });
}

/**
 * Terapkan LUT ke SELURUH video — video mentahnya diputar ulang dari awal
 * sampai akhir secara real-time (offscreen, gak kelihatan tamu), tiap frame
 * digambar ke canvas dengan LUT diterapkan (nearest-neighbor, biar cukup
 * ringan buat diproses puluhan/ratusan frame), lalu direkam ulang jadi file
 * baru lewat MediaRecorder. Audio aslinya ikut dibawa lewat
 * video.captureStream() (bukan direkam ulang dari speaker).
 *
 * Karena ini proses REAL-TIME (bukan instan), durasi prosesnya kurang lebih
 * sama dengan durasi videonya sendiri (video 40 detik ⇒ proses ini juga
 * makan waktu sekitar 40 detik). onProgress dipanggil dengan persentase
 * (0-100) berdasarkan video.currentTime/duration, buat ditampilkan sebagai
 * progress bar ke tamu.
 */
export async function applyFilterToVideo(
  url: string,
  lut: ParsedLUT,
  onProgress?: (percent: number) => void
): Promise<Blob> {
  const video = document.createElement("video");
  video.crossOrigin = "anonymous";
  video.playsInline = true;
  video.muted = true; // biar gak bunyi di speaker HP tamu pas diproses; captureStream() tetap bawa audio aslinya
  video.src = url;

  await new Promise<void>((resolve, reject) => {
    video.onloadedmetadata = () => resolve();
    video.onerror = () => reject(new Error("Gagal memuat video mentah"));
  });

  const canvas = document.createElement("canvas");
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas tidak didukung");

  const mediaStream = (video as HTMLVideoElement & { captureStream?: () => MediaStream }).captureStream?.();
  if (!mediaStream) throw new Error("Browser ini tidak mendukung pemrosesan video di sisi klien");
  const audioTracks = mediaStream.getAudioTracks();

  const canvasStream = canvas.captureStream(30);
  const recordStream = new MediaStream([...canvasStream.getVideoTracks(), ...audioTracks]);

  const preferredTypes = ["video/mp4", "video/webm;codecs=vp9,opus", "video/webm"];
  const supportedType = preferredTypes.find((t) => MediaRecorder.isTypeSupported(t));
  const recorder = supportedType
    ? new MediaRecorder(recordStream, { mimeType: supportedType })
    : new MediaRecorder(recordStream);

  const chunks: Blob[] = [];
  recorder.ondataavailable = (e) => {
    if (e.data.size > 0) chunks.push(e.data);
  };

  let rafId: number | null = null;
  function drawLoop() {
    if (!video.ended && !video.paused) {
      ctx!.drawImage(video, 0, 0, canvas.width, canvas.height);
      const imageData = ctx!.getImageData(0, 0, canvas.width, canvas.height);
      applyLUTNearest(imageData, lut);
      ctx!.putImageData(imageData, 0, 0);
      if (onProgress && video.duration) {
        onProgress(Math.min(100, (video.currentTime / video.duration) * 100));
      }
    }
    rafId = requestAnimationFrame(drawLoop);
  }

  return new Promise((resolve, reject) => {
    recorder.onstop = () => {
      if (rafId) cancelAnimationFrame(rafId);
      const mime = recorder.mimeType || "video/webm";
      resolve(new Blob(chunks, { type: mime }));
    };
    recorder.onerror = () => {
      if (rafId) cancelAnimationFrame(rafId);
      reject(new Error("Gagal merekam ulang video dengan filter"));
    };

    video.onended = () => {
      onProgress?.(100);
      recorder.stop();
    };

    video
      .play()
      .then(() => {
        recorder.start();
        rafId = requestAnimationFrame(drawLoop);
      })
      .catch(reject);
  });
}
