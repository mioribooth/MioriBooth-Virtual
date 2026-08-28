export default function GalleryExampleCard({
  names,
  date,
}: {
  names: string;
  date: string;
}) {
  return (
    <div className="gallery-example-card">
      <div className="gallery-example-photo">
        <div className="gallery-example-glow gallery-example-glow-a" />
        <div className="gallery-example-glow gallery-example-glow-b" />
        <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="24" cy="30" r="14" stroke="currentColor" strokeWidth="2.5" />
          <circle cx="40" cy="30" r="14" stroke="currentColor" strokeWidth="2.5" />
        </svg>
      </div>
      <div className="gallery-example-footer">
        <span className="font-display">{names}</span>
        <span className="gallery-example-date">{date}</span>
      </div>
    </div>
  );
}
