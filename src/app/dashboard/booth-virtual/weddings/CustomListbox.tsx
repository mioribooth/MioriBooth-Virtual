"use client";

import { useEffect, useRef, useState } from "react";

export interface ListboxOption {
  value: string;
  label: string;
  description?: string;
}

export default function CustomListbox({
  value,
  onChange,
  options,
  placeholder = "Pilih...",
}: {
  value: string;
  onChange: (value: string) => void;
  options: ListboxOption[];
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const selected = options.find((o) => o.value === value);

  // Klik di luar box-nya nutup dropdown-nya — dropdown custom (bukan native
  // <select>) jadi kita yang harus urus sendiri behaviour ini.
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="custom-listbox" ref={rootRef}>
      <button
        type="button"
        className={`custom-listbox-trigger ${open ? "is-open" : ""}`}
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className={selected ? "" : "muted"}>{selected ? selected.label : placeholder}</span>
        <svg
          className="custom-listbox-chevron"
          viewBox="0 0 20 20"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M5 7.5L10 12.5L15 7.5"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {open && (
        <div className="custom-listbox-panel" role="listbox">
          {options.map((o) => (
            <button
              key={o.value}
              type="button"
              role="option"
              aria-selected={o.value === value}
              className={`custom-listbox-option ${o.value === value ? "is-selected" : ""}`}
              onClick={() => {
                onChange(o.value);
                setOpen(false);
              }}
            >
              <span className="custom-listbox-option-label">{o.label}</span>
              {o.description && (
                <span className="custom-listbox-option-desc">{o.description}</span>
              )}
              {o.value === value && <span className="custom-listbox-option-check">✓</span>}
            </button>
          ))}
          {options.length === 0 && (
            <div className="custom-listbox-empty muted">Belum ada pilihan</div>
          )}
        </div>
      )}
    </div>
  );
}
