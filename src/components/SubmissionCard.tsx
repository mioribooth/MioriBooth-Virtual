"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export interface SubmissionCardData {
  id: string;
  guestName: string | null;
  mediaType: string; // "PHOTO" | "VIDEO"
  composedUrl: string;
  voiceNoteUrl: string | null;
  createdAt: string | Date;
  isHidden: boolean;
}

export default function SubmissionCard({
  weddingId,
  submission,
}: {
  weddingId: string;
  submission: SubmissionCardData;
}) {
  const router = useRouter();
  const [isHidden, setIsHidden] = useState(submission.isHidden);
  const [busy, setBusy] = useState(false);

  async function toggleHidden() {
    setBusy(true);
    try {
      const res = await fetch(
        `/api/admin/weddings/${weddingId}/submissions/${submission.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isHidden: !isHidden }),
        }
      );
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Gagal mengubah status submission");
      }
      setIsHidden(!isHidden);
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete() {
    const confirmed = window.confirm(
      `Yakin mau hapus submission dari "${submission.guestName || "Tamu"}"?\n\nTidak bisa dikembalikan.`
    );
    if (!confirmed) return;

    setBusy(true);
    try {
      const res = await fetch(
        `/api/admin/weddings/${weddingId}/submissions/${submission.id}`,
        { method: "DELETE" }
      );
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Gagal menghapus submission");
      }
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Terjadi kesalahan");
      setBusy(false);
    }
  }

  return (
    <div className="card" style={{ opacity: isHidden ? 0.5 : 1 }}>
      <div style={{ position: "relative" }}>
        {submission.mediaType === "PHOTO" ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={submission.composedUrl}
            alt={submission.guestName ?? "Tamu"}
            style={{ width: "100%", aspectRatio: "3/4", objectFit: "cover", borderRadius: 8 }}
          />
        ) : (
          // eslint-disable-next-line jsx-a11y/media-has-caption
          <video
            src={submission.composedUrl}
            controls
            style={{ width: "100%", aspectRatio: "3/4", objectFit: "cover", borderRadius: 8 }}
          />
        )}
        {isHidden && (
          <span
            style={{
              position: "absolute",
              top: 8,
              left: 8,
              background: "rgba(0,0,0,0.7)",
              color: "#fff",
              fontSize: 11,
              padding: "2px 8px",
              borderRadius: 999,
            }}
          >
            Disembunyikan
          </span>
        )}
      </div>
      <div style={{ marginTop: 10 }}>
        <strong style={{ fontSize: 14 }}>{submission.guestName || "Tamu"}</strong>
        <p className="muted" style={{ fontSize: 12, margin: "4px 0" }}>
          {new Date(submission.createdAt).toLocaleString("id-ID")}
        </p>
        {submission.voiceNoteUrl && (
          // eslint-disable-next-line jsx-a11y/media-has-caption
          <audio src={submission.voiceNoteUrl} controls style={{ width: "100%", height: 32 }} />
        )}
        <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
          <button
            type="button"
            className="btn"
            onClick={toggleHidden}
            disabled={busy}
            style={{ flex: 1, fontSize: 12 }}
          >
            {isHidden ? "Tampilkan" : "Sembunyikan"}
          </button>
          <button
            type="button"
            className="btn btn-danger"
            onClick={handleDelete}
            disabled={busy}
            style={{ flex: 1, fontSize: 12 }}
          >
            Hapus
          </button>
        </div>
      </div>
    </div>
  );
}
