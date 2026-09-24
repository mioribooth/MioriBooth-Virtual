"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import FilmstripSteps from "@/components/FilmstripSteps";
import Spinner from "@/components/Spinner";
import { getBoothToken, getSession, patchSession } from "@/lib/wizardClient";
import { uploadToCloudinary } from "@/lib/uploadClient";
import { parseCubeLUT, applyLUTTrilinear, loadImage, ParsedLUT } from "@/lib/lut";
import { applyFilterToImage, applyFilterToVideo } from "@/lib/filterProcessing";
import "./filter.css";

interface FilterOption {
  id: string;
  name: string;
  lutFileUrl: string;
  lutSize: number;
}

const THUMB_W = 220;
const THUMB_H = 275;

export default function FilterPage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const token = getBoothToken(slug);

  const [totalSteps, setTotalSteps] = useState(7);
  const [mediaType, setMediaType] = useState<"PHOTO" | "VIDEO">("PHOTO");
  const [rawVideoUrl, setRawVideoUrl] = useState<string | null>(null);
  const [rawPhotoUrls, setRawPhotoUrls] = useState<string[]>([]);

  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<FilterOption[]>([]);
  const [previews, setPreviews] = useState<Record<string, string>>({}); // "normal" | filterId -> data URL
  const [selected, setSelected] = useState<string>("normal");
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const lutCacheRef = useRef<Map<string, ParsedLUT>>(new Map());

  useEffect(() => {
    if (!token) return;
    (async () => {
      const [session, weddingRes] = await Promise.all([
        getSession(token),
        fetch(`/api/weddings/${slug}`),
      ]);
      if (!session) {
        router.replace(`/w/${slug}`);
        return;
      }
      const wedding = await weddingRes.json().catch(() => null);
      if (wedding?.mediaMode) {
        setTotalSteps(wedding.mediaMode === "PHOTO_ONLY" ? 6 : 7);
      }
      setMediaType(session.mediaType ?? "PHOTO");
      setRawPhotoUrls(session.rawPhotoUrls ?? []);
      setRawVideoUrl(session.rawVideoUrl ?? null);

      const filtersRes = await fetch(`/api/weddings/${slug}/filters`);
      const filtersData = await filtersRes.json().catch(() => ({ filters: [] }));
      const list: FilterOption[] = filtersData.filters ?? [];

      // Vendor belum upload filter apa pun — lewati halaman ini sama sekali,
      // langsung lanjut ke review seperti alur lama.
      if (list.length === 0) {
        router.replace(`/w/${slug}/review`);
        return;
      }
      setFilters(list);

      // Ambil satu gambar representatif buat di-preview: foto pertama, atau
      // (buat video) satu frame diambil dari detik ke-0.5 videonya.
      let sampleImg: HTMLImageElement;
      if ((session.mediaType ?? "PHOTO") === "PHOTO" && session.rawPhotoUrls?.[0]) {
        sampleImg = await loadImage(session.rawPhotoUrls[0]);
      } else if (session.rawVideoUrl) {
        sampleImg = await extractVideoFrame(session.rawVideoUrl);
      } else {
        setError("Data hasil capture tidak ditemukan, ulangi dari awal.");
        setLoading(false);
        return;
      }

      // Preview "Normal" (tanpa filter)
      const normalCanvas = document.createElement("canvas");
      normalCanvas.width = THUMB_W;
      normalCanvas.height = THUMB_H;
      const normalCtx = normalCanvas.getContext("2d")!;
      drawCover(normalCtx, sampleImg, THUMB_W, THUMB_H);
      const previewMap: Record<string, string> = { normal: normalCanvas.toDataURL("image/jpeg", 0.85) };

      // Preview tiap filter — fetch + parse .cube-nya, cache buat dipakai lagi
      // pas proses final (biar gak fetch dua kali).
      await Promise.all(
        list.map(async (f) => {
          try {
            const text = await fetch(f.lutFileUrl).then((r) => r.text());
            const parsed = parseCubeLUT(text);
            lutCacheRef.current.set(f.id, parsed);

            const canvas = document.createElement("canvas");
            canvas.width = THUMB_W;
            canvas.height = THUMB_H;
            const ctx = canvas.getContext("2d")!;
            drawCover(ctx, sampleImg, THUMB_W, THUMB_H);
            const imageData = ctx.getImageData(0, 0, THUMB_W, THUMB_H);
            applyLUTTrilinear(imageData, parsed);
            ctx.putImageData(imageData, 0, 0);
            previewMap[f.id] = canvas.toDataURL("image/jpeg", 0.85);
          } catch {
            // filter ini gagal diparse/dimuat — skip aja, gak perlu gagalin semua halaman
          }
        })
      );

      setPreviews(previewMap);
      setLoading(false);
    })().catch(() => {
      setError("Gagal memuat data. Coba muat ulang halaman.");
      setLoading(false);
    });
  }, [token, slug, router]);

  async function handleContinue() {
    if (!token) return;

    if (selected === "normal") {
      await patchSession(token, { step: "filter_done" });
      router.push(`/w/${slug}/review`);
      return;
    }

    const lut = lutCacheRef.current.get(selected);
    if (!lut) return;

    setProcessing(true);
    setProgress(0);
    setError(null);
    try {
      if (mediaType === "PHOTO") {
        const newUrls: string[] = [];
        for (let i = 0; i < rawPhotoUrls.length; i++) {
          const blob = await applyFilterToImage(rawPhotoUrls[i], lut);
          const uploaded = await uploadToCloudinary(blob, "image", "booth-virtual/raw");
          newUrls.push(uploaded.secure_url);
          setProgress(Math.round(((i + 1) / rawPhotoUrls.length) * 100));
        }
        await patchSession(token, { rawPhotoUrls: newUrls, step: "filter_done" });
      } else if (rawVideoUrl) {
        // Proses video makan porsi 0-80% (real-time re-encode), sisanya
        // 80-100% buat upload hasilnya.
        const blob = await applyFilterToVideo(rawVideoUrl, lut, (pct) =>
          setProgress(Math.round(pct * 0.8))
        );
        setProgress(85);
        const uploaded = await uploadToCloudinary(blob, "video", "booth-virtual/raw");
        setProgress(100);
        await patchSession(token, { rawVideoUrl: uploaded.secure_url, step: "filter_done" });
      }
      router.push(`/w/${slug}/review`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menerapkan filter, coba lagi.");
      setProcessing(false);
    }
  }

  if (error && !processing) {
    return (
      <div className="booth-shell">
        <div className="booth-content state-message">
          <p className="muted">{error}</p>
          <button className="btn btn-secondary" onClick={() => router.push(`/w/${slug}/review`)}>
            Lewati, lanjut tanpa filter
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="booth-shell">
      <FilmstripSteps total={totalSteps} currentIndex={2} />
      <div className="booth-content filter-content">
        <span className="eyebrow">Pilih Filter</span>
        <h2 className="font-display">Suka yang mana?</h2>
        <p className="muted" style={{ marginBottom: 14 }}>
          Filter cuma ngubah warna foto/videonya — frame tetap sama persis.
        </p>

        {loading ? (
          <div className="filter-loading">
            <Spinner dark size={30} />
          </div>
        ) : (
          <>
            <div className="filter-main-preview">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={previews[selected] ?? previews.normal} alt="Preview filter" />
              {processing && (
                <div className="filter-processing-overlay">
                  <Spinner size={34} />
                  <p>Menerapkan filter... {progress}%</p>
                </div>
              )}
            </div>

            <div className="filter-strip">
              <button
                type="button"
                className={`filter-chip ${selected === "normal" ? "is-selected" : ""}`}
                onClick={() => setSelected("normal")}
                disabled={processing}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={previews.normal} alt="Normal" />
                <span>Normal</span>
              </button>
              {filters.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  className={`filter-chip ${selected === f.id ? "is-selected" : ""}`}
                  onClick={() => setSelected(f.id)}
                  disabled={processing || !previews[f.id]}
                >
                  {previews[f.id] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={previews[f.id]} alt={f.name} />
                  ) : (
                    <span className="filter-chip-fallback">?</span>
                  )}
                  <span>{f.name}</span>
                </button>
              ))}
            </div>

            {error && <p className="muted" style={{ color: "var(--color-danger)" }}>{error}</p>}

            <button
              className="btn btn-primary btn-block"
              onClick={handleContinue}
              disabled={processing}
              style={{ marginTop: 16 }}
            >
              {processing ? (
                <>
                  <Spinner /> Memproses...
                </>
              ) : (
                "Lanjut"
              )}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

/** Gambar image ke canvas dengan efek object-fit: cover. */
function drawCover(ctx: CanvasRenderingContext2D, img: HTMLImageElement, w: number, h: number) {
  const imgRatio = img.naturalWidth / img.naturalHeight;
  const boxRatio = w / h;
  let sx = 0,
    sy = 0,
    sw = img.naturalWidth,
    sh = img.naturalHeight;
  if (imgRatio > boxRatio) {
    sw = img.naturalHeight * boxRatio;
    sx = (img.naturalWidth - sw) / 2;
  } else {
    sh = img.naturalWidth / boxRatio;
    sy = (img.naturalHeight - sh) / 2;
  }
  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, w, h);
}

/** Ambil satu frame dari video (di detik ke-0.5) sebagai HTMLImageElement, buat sample preview filter. */
async function extractVideoFrame(url: string): Promise<HTMLImageElement> {
  const video = document.createElement("video");
  video.crossOrigin = "anonymous";
  video.muted = true;
  video.playsInline = true;
  video.src = url;

  await new Promise<void>((resolve, reject) => {
    video.onloadedmetadata = () => {
      video.currentTime = Math.min(0.5, (video.duration || 1) / 2);
    };
    video.onseeked = () => resolve();
    video.onerror = () => reject(new Error("Gagal memuat video"));
  });

  const canvas = document.createElement("canvas");
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(video, 0, 0);

  return loadImage(canvas.toDataURL("image/jpeg", 0.9));
}
