import { prisma } from "@/lib/prisma";

// Layout ini cuma nge-bungkus semua halaman booth tamu (/w/[slug]/*) dengan
// class tema (burgundy/sky-blue) sesuai pilihan admin buat wedding ini.
// Halaman-halamannya sendiri (welcome, frame, capture, review, print,
// success, voice, video-note) sama sekali gak perlu diubah — mereka udah
// pakai CSS variable var(--color-maroon-*)/var(--color-gold-*), jadi
// otomatis ikut warna baru begitu variable-nya di-override lewat class ini.
export default async function WeddingBoothLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { slug: string };
}) {
  const wedding = await prisma.wedding.findUnique({
    where: { slug: params.slug },
    select: { theme: true },
  });

  const themeClass = wedding?.theme === "SKY_BLUE" ? "theme-sky-blue" : "theme-burgundy";

  return <div className={themeClass}>{children}</div>;
}
