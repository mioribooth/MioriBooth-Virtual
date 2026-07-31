import { prisma } from "@/lib/prisma";
import "./gallery.css";

export default async function GalleryPage({
  params,
}: {
  params: { gallerySlug: string };
}) {
  const wedding = await prisma.wedding.findUnique({
    where: { gallerySlug: params.gallerySlug },
    include: { submissions: { orderBy: { createdAt: "desc" } } },
  });

  if (!wedding) {
    return (
      <div className="gallery-shell">
        <div className="state-message">
          <h2>Galeri tidak ditemukan</h2>
        </div>
      </div>
    );
  }

  const isExpired = new Date() > wedding.accessExpiresAt;

  return (
    <div className="gallery-shell">
      <header className="gallery-header">
        <span className="eyebrow">Wedding Gallery</span>
        <h1 className="font-display">
          {wedding.groomName} &amp; {wedding.brideName}
        </h1>
        <p className="muted">
          {wedding.submissions.length} kenangan tersimpan dari tamu undangan
        </p>
      </header>

      {isExpired ? (
        <div className="state-message">
          <h2>Masa akses galeri sudah berakhir</h2>
          <p className="muted">
            Hubungi vendor booth kamu kalau butuh salinan seluruh kenangan.
          </p>
        </div>
      ) : (
        <div className="gallery-grid">
          {wedding.submissions.map((s) => (
            <div key={s.id} className="gallery-card">
              {s.mediaType === "PHOTO" ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={s.composedUrl} alt={s.guestName ?? "Tamu"} />
              ) : (
                // eslint-disable-next-line jsx-a11y/media-has-caption
                <video src={s.composedUrl} controls />
              )}
              <div className="gallery-card-info">
                <span className="gallery-card-name">{s.guestName || "Tamu"}</span>
                {s.voiceNoteUrl && (
                  // eslint-disable-next-line jsx-a11y/media-has-caption
                  <audio src={s.voiceNoteUrl} controls />
                )}
              </div>
            </div>
          ))}
          {wedding.submissions.length === 0 && (
            <p className="muted">Belum ada kenangan yang tersimpan.</p>
          )}
        </div>
      )}
    </div>
  );
}
