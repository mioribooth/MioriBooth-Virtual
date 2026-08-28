import { prisma } from "@/lib/prisma";
import GalleryLightbox from "./GalleryLightbox";
import "./gallery.css";

export default async function GalleryPage({
  params,
}: {
  params: { gallerySlug: string };
}) {
  const wedding = await prisma.wedding.findUnique({
    where: { gallerySlug: params.gallerySlug },
    include: { submissions: { where: { isHidden: false }, orderBy: { createdAt: "desc" } } },
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
        <div className="gallery-grid-wrap">
          <GalleryLightbox submissions={wedding.submissions} />
        </div>
      )}
    </div>
  );
}
