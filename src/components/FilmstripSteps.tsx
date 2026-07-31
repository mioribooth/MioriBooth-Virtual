interface FilmstripStepsProps {
  total: number;
  currentIndex: number; // 0-based
}

export default function FilmstripSteps({ total, currentIndex }: FilmstripStepsProps) {
  return (
    <div className="filmstrip-steps" aria-label={`Langkah ${currentIndex + 1} dari ${total}`}>
      {Array.from({ length: total }).map((_, i) => (
        <span
          key={i}
          className={
            "filmstrip-hole" +
            (i === currentIndex ? " is-active" : i < currentIndex ? " is-done" : "")
          }
        />
      ))}
    </div>
  );
}
