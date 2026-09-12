"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { IconTrash } from "@/components/icons";

export default function DeleteFrameButton({
  weddingId,
  frameId,
  frameName,
}: {
  weddingId: string;
  frameId: string;
  frameName: string;
}) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  async function handleDelete(e: React.MouseEvent) {
    // Kartu frame di sekelilingnya adalah <Link> ke halaman editor — cegah
    // klik tombol hapus ini ikut memicu navigasi ke sana.
    e.preventDefault();
    e.stopPropagation();

    const confirmed = window.confirm(`Yakin mau hapus frame "${frameName}"?`);
    if (!confirmed) return;

    setDeleting(true);
    try {
      const res = await fetch(
        `/api/admin/weddings/${weddingId}/frames/${frameId}`,
        { method: "DELETE" }
      );
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Gagal menghapus frame");
      }
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Terjadi kesalahan");
      setDeleting(false);
    }
  }

  return (
    <button
      className="frame-delete-btn"
      onClick={handleDelete}
      disabled={deleting}
      type="button"
      aria-label={`Hapus frame ${frameName}`}
      title="Hapus frame"
    >
      <IconTrash size={14} />
    </button>
  );
}
