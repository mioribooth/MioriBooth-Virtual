"use client";

import { useState } from "react";
import { THEME_OPTIONS } from "@/lib/themeOptions";

export default function ThemePicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (id: "BURGUNDY" | "SKY_BLUE") => void;
}) {
  const [open, setOpen] = useState(false);
  const current = THEME_OPTIONS.find((t) => t.id === value) ?? THEME_OPTIONS[0];

  return (
    <>
      <button type="button" className="theme-picker-trigger" onClick={() => setOpen(true)}>
        <span
          className="theme-picker-swatch"
          style={{
            background: `linear-gradient(160deg, ${current.gradientFrom}, ${current.gradientTo})`,
          }}
        />
        <span>{current.label}</span>
        <span className="theme-picker-trigger-hint">Ganti tema</span>
      </button>

      {open && (
        <div
          className="theme-popup-overlay"
          onClick={() => setOpen(false)}
          role="dialog"
          aria-modal="true"
        >
          <div className="theme-popup-panel" onClick={(e) => e.stopPropagation()}>
            <div className="theme-popup-header">
              <strong>Pilih Tema Booth &amp; Slideshow</strong>
              <button
                type="button"
                className="theme-popup-close"
                onClick={() => setOpen(false)}
                aria-label="Tutup"
              >
                ✕
              </button>
            </div>
            <div className="theme-popup-grid">
              {THEME_OPTIONS.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  className={`theme-popup-card ${value === t.id ? "is-selected" : ""}`}
                  onClick={() => {
                    onChange(t.id);
                    setOpen(false);
                  }}
                >
                  <div
                    className="theme-popup-preview"
                    style={{
                      background: `linear-gradient(160deg, ${t.gradientFrom}, ${t.gradientTo})`,
                    }}
                  >
                    <span className="theme-popup-preview-eyebrow" style={{ color: t.accent }}>
                      Wedding Memories Of
                    </span>
                    <span className="theme-popup-preview-title">
                      Adi <em style={{ color: t.accent }}>&amp;</em> Ananda
                    </span>
                  </div>
                  <span className="theme-popup-card-label">
                    {t.label}
                    {value === t.id && <span className="theme-popup-check">✓ Terpilih</span>}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
