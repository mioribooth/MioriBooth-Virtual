import { prisma } from "@/lib/prisma";
import SlideshowClient from "./SlideshowClient";
import "./slideshow.css";

export default async function SlideshowPage({
  params,
}: {
  params: { gallerySlug: string };
}) {
  const wedding = await prisma.wedding.findUnique({
    where: { gallerySlug: params.gallerySlug },
    select: { id: true },
  });

  if (!wedding) {
    return (
      <div className="slideshow-shell slideshow-state">
        <h2>Galeri tidak ditemukan</h2>
      </div>
    );
  }

  return <SlideshowClient gallerySlug={params.gallerySlug} />;
}
