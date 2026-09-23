"use client";

const MIN_PX = 20;
const MAX_PX = 60;
const STEP_PX = 2;

export default function FontSizeStepper({
  scale,
  onChange,
}: {
  scale: number; // pengali terhadap base 30px
  onChange: (scale: number) => void;
}) {
  const px = Math.round(30 * scale);

  function setPx(nextPx: number) {
    const clamped = Math.min(MAX_PX, Math.max(MIN_PX, nextPx));
    onChange(clamped / 30);
  }

  return (
    <div className="font-size-stepper">
      <button
        type="button"
        className="font-size-stepper-btn"
        onClick={() => setPx(px - STEP_PX)}
        disabled={px <= MIN_PX}
        aria-label="Perkecil ukuran font"
      >
        −
      </button>
      <span className="font-size-stepper-value">{px}px</span>
      <button
        type="button"
        className="font-size-stepper-btn"
        onClick={() => setPx(px + STEP_PX)}
        disabled={px >= MAX_PX}
        aria-label="Perbesar ukuran font"
      >
        +
      </button>
    </div>
  );
}
