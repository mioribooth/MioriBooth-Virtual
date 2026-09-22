"use client";

import { useRef, useState } from "react";
import Spinner from "@/components/Spinner";
import "./cover-editor.css";

export interface CoverAdjust {
  url: string | null;
  posX: number; // 0-100
  posY: number; // 0-100
  scale: number; // 1 - 2.5
}

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

export default function CoverPhotoEditor({
  value,
  onChange,
  onUpload,
}: {
  value: CoverAdjust;
  onChange: (next: CoverAdjust) => void;
  onUpload: (file: File) => Promise<string>;
}) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef(false);
  const lastPointerRef = useRef({ x: 0, y: 0 });

  async function processFile(file: File) {
    if (!file.type.startsWith("image/")) {
      setUploadError("File harus berupa gambar (JPG/PNG).");
      return;
    }
    setUploadError(null);
    setUploading(true);
    try {
      const url = await onUpload(file);
      // Foto baru = posisi & zoom di-reset ke default, karena penyesuaian
      // lama belum tentu masih pas buat foto yang baru ini.
      onChange({ url, posX: 50, posY: 50, scale: 1 });
    } catch {
      setUploadError("Upload foto cover gagal, coba lagi.");
    } finally {
      setUploading(false);
    }
  }

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    e.target.value = "";
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  }

  // Geser foto = drag langsung di atas gambarnya (kayak Instagram/Facebook
  // cover editor). Dibagi dengan value.scale supaya kerasa konsisten pas
  // lagi di-zoom: makin di-zoom, gerakan mouse yang sama mindahin "pandangan"
  // lebih sedikit secara persentase (areanya kan makin sempit relatif ke
  // gambar aslinya).
  function handlePointerDown(e: React.PointerEvent) {
    if (!value.url) return;
    draggingRef.current = true;
    lastPointerRef.current = { x: e.clientX, y: e.clientY };
    (e.target as Element).setPointerCapture?.(e.pointerId);
  }

  function handlePointerMove(e: React.PointerEvent) {
    if (!draggingRef.current || !frameRef.current) return;
    const rect = frameRef.current.getBoundingClientRect();
    const dx = e.clientX - lastPointerRef.current.x;
    const dy = e.clientY - lastPointerRef.current.y;
    lastPointerRef.current = { x: e.clientX, y: e.clientY };
    const nextPosX = clamp(value.posX - (dx / rect.width) * 100 * (1 / value.scale), 0, 100);
    const nextPosY = clamp(value.posY - (dy / rect.height) * 100 * (1 / value.scale), 0, 100);
    onChange({ ...value, posX: nextPosX, posY: nextPosY });
  }

  function handlePointerUp(e: React.PointerEvent) {
    draggingRef.current = false;
    try {
      (e.target as Element).releasePointerCapture?.(e.pointerId);
    } catch {
      // ignore
    }
  }

  return (
    <div>
      {!value.url ? (
        <div
          className={`cover-dropzone ${isDragOver ? "is-dragover" : ""}`}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragOver(true);
          }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          role="button"
          tabIndex={0}
        >
          {uploading ? (
            <div className="cover-dropzone-uploading">
              <Spinner dark size={30} />
              <p>Mengunggah...</p>
            </div>
          ) : (
            <div className="cover-dropzone-empty">
              <span className="cover-dropzone-icon">📸</span>
              <p>
                <strong>Klik atau seret foto ke sini</strong>
              </p>
              <p className="muted" style={{ fontSize: 12, margin: 0 }}>
                JPG/PNG, disarankan foto potret (vertikal)
              </p>
            </div>
          )}
        </div>
      ) : (
        <>
          <div
            ref={frameRef}
            className="cover-adjust-frame"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragOver(true);
            }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={handleDrop}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={value.url}
              alt="Foto cover pengantin"
              draggable={false}
              style={{
                objectPosition: `${value.posX}% ${value.posY}%`,
                transform: `scale(${value.scale})`,
              }}
            />
            <div className="cover-adjust-hint">✥ Geser buat atur posisi</div>
            {(uploading || isDragOver) && (
              <div className="cover-dropzone-uploading cover-reupload-overlay">
                {uploading ? (
                  <>
                    <Spinner size={30} />
                    <p>Mengunggah...</p>
                  </>
                ) : (
                  <p>Lepas buat ganti foto</p>
                )}
              </div>
            )}
          </div>

          <div className="cover-adjust-controls">
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              Ganti Foto
            </button>
            <label className="cover-zoom-control">
              <span aria-hidden="true">🔍</span>
              <input
                type="range"
                min={1}
                max={2.5}
                step={0.05}
                value={value.scale}
                onChange={(e) => onChange({ ...value, scale: Number(e.target.value) })}
                aria-label="Zoom foto cover"
              />
            </label>
          </div>
        </>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileInput}
        style={{ display: "none" }}
      />

      {uploadError && (
        <p className="muted" style={{ color: "var(--color-danger)", marginTop: 8, fontSize: 13 }}>
          {uploadError}
        </p>
      )}
    </div>
  );
}
