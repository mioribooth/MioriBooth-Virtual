"use client";

import { TITLE_FONTS } from "@/lib/titleFonts";

export default function FontFamilyPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (id: string) => void;
}) {
  return (
    <div className="font-family-picker">
      {TITLE_FONTS.map((f) => (
        <button
          key={f.id}
          type="button"
          className={`font-family-card ${value === f.id ? "is-selected" : ""}`}
          onClick={() => onChange(f.id)}
          style={{ fontFamily: f.cssVar, fontStyle: f.italic ? "italic" : "normal" }}
        >
          <span className="font-family-sample">Aa</span>
          <span className="font-family-label">{f.label}</span>
        </button>
      ))}
    </div>
  );
}
