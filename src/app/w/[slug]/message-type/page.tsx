"use client";

import { useParams, useRouter } from "next/navigation";
import FilmstripSteps from "@/components/FilmstripSteps";
import { IconMic, IconTextMessage } from "@/components/icons";
import "./message-type.css";

export default function MessageTypePage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();

  return (
    <div className="booth-shell">
      {/* Ini masih bagian dari step yang sama kayak halaman rekam suara/tulis
          pesan (bukan step baru terpisah) — jadi nomor & total langkahnya
          disamain persis kayak voice.tsx/text-message. */}
      <FilmstripSteps total={7} currentIndex={4} />
      <div className="booth-content">
        <span className="eyebrow">Langkah 4</span>
        <h2 className="font-display">Mau tinggalkan pesan gimana?</h2>
        <p className="muted" style={{ marginBottom: 24 }}>
          Pilih salah satu buat kirim doa/harapan ke kedua mempelai.
        </p>

        <div className="message-type-options">
          <button
            type="button"
            className="message-type-card"
            onClick={() => router.push(`/w/${slug}/text-message`)}
          >
            <span className="message-type-icon">
              <IconTextMessage size={30} />
            </span>
            <strong>Tulis Pesan</strong>
            <span className="muted">Ketik doa atau ucapanmu</span>
          </button>

          <button
            type="button"
            className="message-type-card"
            onClick={() => router.push(`/w/${slug}/voice`)}
          >
            <span className="message-type-icon">
              <IconMic size={30} />
            </span>
            <strong>Rekam Suara</strong>
            <span className="muted">Ucapkan langsung lewat mic</span>
          </button>
        </div>
      </div>
    </div>
  );
}
