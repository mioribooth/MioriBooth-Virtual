export default function FrameMockup() {
  return (
    <div className="frame-mockup">
      <div className="frame-mockup-card">
        <div className="frame-mockup-holes">
          {Array.from({ length: 8 }).map((_, i) => (
            <span key={i} />
          ))}
        </div>

        <div className="frame-mockup-photo">
          <div className="frame-mockup-glow frame-mockup-glow-a" />
          <div className="frame-mockup-glow frame-mockup-glow-b" />
          <svg
            viewBox="0 0 64 64"
            className="frame-mockup-icon"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle cx="24" cy="30" r="15" stroke="currentColor" strokeWidth="2.5" />
            <circle cx="40" cy="30" r="15" stroke="currentColor" strokeWidth="2.5" />
          </svg>
          <span className="frame-mockup-badge">Live di Story</span>
        </div>

        <div className="frame-mockup-footer">
          <span className="frame-mockup-names font-display">Ajeng &amp; Yoga</span>
          <span className="frame-mockup-date">12 . 09 . 2026</span>
        </div>
      </div>

      <div className="frame-mockup-tag">Contoh frame — otomatis dipakai di setiap foto tamu</div>
    </div>
  );
}
