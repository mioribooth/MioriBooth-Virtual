import { prisma } from "@/lib/prisma";

// Sama seperti layout booth tamu (/w/[slug]/layout.tsx) — cuma nge-bungkus
// halaman galeri & slideshow (/gallery/[gallerySlug]/*) dengan class tema
// sesuai pilihan admin, tanpa perlu ubah gallery.css / slideshow.css sama
// sekali (sudah pakai CSS variable yang sama).
export default async function GalleryLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { gallerySlug: string };
}) {
  const wedding = await prisma.wedding.findUnique({
    where: { gallerySlug: params.gallerySlug },
    select: { theme: true },
  });

  const themeClass = wedding?.theme === "SKY_BLUE" ? "theme-sky-blue" : "theme-burgundy";

  return <div className={themeClass}>{children}</div>;
}
