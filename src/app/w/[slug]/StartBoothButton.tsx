"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function StartBoothButton({
  weddingId,
  slug,
}: {
  weddingId: string;
  slug: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleStart() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ weddingId }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Gagal memulai sesi");
      }
      const { token } = await res.json();
      sessionStorage.setItem(`booth_token_${slug}`, token);
      router.push(`/w/${slug}/frame`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
      setLoading(false);
    }
  }

  return (
    <div style={{ width: "100%" }}>
      <button className="btn btn-primary btn-block" onClick={handleStart} disabled={loading}>
        {loading ? "Menyiapkan..." : "Tinggalkan Pesan"}
      </button>
      {error && (
        <p className="muted" style={{ color: "#ffd7d7", marginTop: 10 }}>
          {error}
        </p>
      )}
    </div>
  );
}
