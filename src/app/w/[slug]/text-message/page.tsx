"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import FilmstripSteps from "@/components/FilmstripSteps";
import Spinner from "@/components/Spinner";
import { IconTextMessage } from "@/components/icons";
import { getBoothToken, patchSession } from "@/lib/wizardClient";
import "../message-type/message-type.css";
import "./text-message.css";

const MAX_LENGTH = 500;

export default function TextMessagePage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const token = getBoothToken(slug);

  const [message, setMessage] = useState("");
  const [finishing, setFinishing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFinish() {
    if (!token || !message.trim()) return;
    setFinishing(true);
    setError(null);
    try {
      await patchSession(token, { textMessage: message.trim(), step: "text_done" });
      router.push(`/w/${slug}/print`);
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
      <FilmstripSteps total={7} currentIndex={4} />
      <div className="booth-content">
        <span className="eyebrow">Langkah 4</span>
        <h2 className="font-display">Tulis pesanmu</h2>
        <p className="muted" style={{ marginBottom: 20 }}>
          Tuliskan doa atau harapan terbaikmu untuk kedua mempelai.
        </p>

        <div className="text-message-panel">
          <span className="message-type-icon" style={{ marginBottom: 12 }}>
            <IconTextMessage size={26} />
          </span>
          <textarea
            className="field-input text-message-input"
            rows={6}
            value={message}
            maxLength={MAX_LENGTH}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Selamat menempuh hidup baru..."
            autoFocus
          />
          <p className="muted text-message-counter">
            {message.length}/{MAX_LENGTH}
          </p>

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
            disabled={!message.trim() || finishing}
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
