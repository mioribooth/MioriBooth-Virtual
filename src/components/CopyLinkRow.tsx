"use client";

import { useState } from "react";

export default function CopyLinkRow({ label, path }: { label: string; path: string }) {
  const [copied, setCopied] = useState(false);

  // Ambil origin langsung dari browser, jadi tidak bergantung pada
  // NEXT_PUBLIC_BASE_URL sudah diset benar atau belum.
  const fullUrl =
    typeof window !== "undefined" ? `${window.location.origin}${path}` : path;

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(fullUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback: seleksi teks manual kalau clipboard API diblokir
    }
  }

  return (
    <div style={{ marginBottom: 14 }}>
      <span className="field-label">{label}</span>
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <a
          href={fullUrl}
          target="_blank"
          rel="noreferrer"
          style={{ wordBreak: "break-all", fontSize: 14, flex: 1 }}
        >
          {fullUrl}
        </a>
        <button
          type="button"
          onClick={handleCopy}
          className="btn btn-ghost"
          style={{ padding: "6px 12px", fontSize: 13, whiteSpace: "nowrap" }}
        >
          {copied ? "Tersalin ✓" : "Copy"}
        </button>
      </div>
    </div>
  );
}
