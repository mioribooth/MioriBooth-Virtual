export default function TemplatePreviewCard({
  title,
  subtitle,
  slots,
}: {
  title: string;
  subtitle: string;
  slots: number;
}) {
  return (
    <div className="template-card">
      <div className={`template-strip template-strip-${slots}`}>
        {Array.from({ length: slots }).map((_, i) => (
          <div key={i} className="template-slot" />
        ))}
      </div>
      <h3>{title}</h3>
      <p className="muted">{subtitle}</p>
    </div>
  );
}
