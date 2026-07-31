"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function DeleteWeddingButton({
  weddingId,
  coupleName,
}: {
  weddingId: string;
  coupleName: string;
}) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    const confirmed = window.confirm(
      `Yakin mau hapus event "${coupleName}"?\n\nSemua frame dan submission tamu yang sudah tersimpan untuk wedding ini akan ikut terhapus permanen dan tidak bisa dikembalikan.`
    );
    if (!confirmed) return;

    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/weddings/${weddingId}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Gagal menghapus wedding");
      }
      router.push("/dashboard/booth-virtual/weddings");
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Terjadi kesalahan");
      setDeleting(false);
    }
  }

  return (
    <button className="btn btn-danger" onClick={handleDelete} disabled={deleting} type="button">
      {deleting ? "Menghapus..." : "Hapus Event"}
    </button>
  );
}
