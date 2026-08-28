"use client";

export default function CustomSelect({
  value,
  onChange,
  children,
  required,
}: {
  value: string;
  onChange: (value: string) => void;
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <div className="custom-select">
      <select
        className="field-input custom-select-native"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
      >
        {children}
      </select>
      <svg
        className="custom-select-chevron"
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
    </div>
  );
}
