"use client";

export default function NameOrderToggle({
  value,
  onChange,
  groomName,
  brideName,
}: {
  value: string;
  onChange: (value: "GROOM_FIRST" | "BRIDE_FIRST") => void;
  groomName: string;
  brideName: string;
}) {
  const groomLabel = groomName.trim() || "Nama Pria";
  const brideLabel = brideName.trim() || "Nama Wanita";

  return (
    <div className="name-order-toggle">
      <button
        type="button"
        className={value !== "BRIDE_FIRST" ? "is-active" : ""}
        onClick={() => onChange("GROOM_FIRST")}
      >
        {groomLabel} dulu
      </button>
      <button
        type="button"
        className={value === "BRIDE_FIRST" ? "is-active" : ""}
        onClick={() => onChange("BRIDE_FIRST")}
      >
        {brideLabel} dulu
      </button>
    </div>
  );
}
