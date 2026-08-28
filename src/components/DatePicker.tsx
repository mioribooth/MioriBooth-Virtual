"use client";

import { useEffect, useRef, useState } from "react";

const MONTH_NAMES = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];
const DAY_LABELS = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];

function toDateOnly(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function parseValue(value: string): Date | null {
  if (!value) return null;
  const [y, m, d] = value.split("-").map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
}

function formatValue(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function formatDisplay(d: Date): string {
  return `${d.getDate()} ${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`;
}

export default function DatePicker({
  value,
  onChange,
  placeholder = "Pilih tanggal",
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  const selected = parseValue(value);
  const [open, setOpen] = useState(false);
  const [viewDate, setViewDate] = useState(selected ?? new Date());
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  function openPicker() {
    setViewDate(selected ?? new Date());
    setOpen(true);
  }

  function pickDay(day: number) {
    const picked = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
    onChange(formatValue(picked));
    setOpen(false);
  }

  function changeMonth(delta: number) {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + delta, 1));
  }

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = toDateOnly(new Date());

  const cells: (number | null)[] = [
    ...Array.from({ length: firstWeekday }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  return (
    <div className="date-picker" ref={wrapperRef}>
      <button type="button" className="field-input date-picker-trigger" onClick={openPicker}>
        <span className={selected ? "" : "date-picker-placeholder"}>
          {selected ? formatDisplay(selected) : placeholder}
        </span>
        <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="3" y="4.5" width="14" height="12" rx="2" stroke="currentColor" strokeWidth="1.5" />
          <path d="M3 8.5H17" stroke="currentColor" strokeWidth="1.5" />
          <path d="M6.5 2.5V5.5M13.5 2.5V5.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </button>

      {/* Nilai dikirim lewat state React (value/onChange), bukan lewat form
          submission native — jadi tidak perlu input hidden untuk validasi. */}

      {open && (
        <div className="date-picker-popup">
          <div className="date-picker-header">
            <button type="button" onClick={() => changeMonth(-1)} aria-label="Bulan sebelumnya">
              <svg viewBox="0 0 20 20" fill="none">
                <path d="M12 5L7 10L12 15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <span>
              {MONTH_NAMES[month]} {year}
            </span>
            <button type="button" onClick={() => changeMonth(1)} aria-label="Bulan berikutnya">
              <svg viewBox="0 0 20 20" fill="none">
                <path d="M8 5L13 10L8 15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
          <div className="date-picker-weekdays">
            {DAY_LABELS.map((d) => (
              <span key={d}>{d}</span>
            ))}
          </div>
          <div className="date-picker-grid">
            {cells.map((day, i) => {
              if (day === null) return <span key={`blank-${i}`} />;
              const cellDate = toDateOnly(new Date(year, month, day));
              const isSelected = selected && cellDate.getTime() === toDateOnly(selected).getTime();
              const isToday = cellDate.getTime() === today.getTime();
              return (
                <button
                  type="button"
                  key={day}
                  className={`date-picker-day${isSelected ? " is-selected" : ""}${
                    isToday && !isSelected ? " is-today" : ""
                  }`}
                  onClick={() => pickDay(day)}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
