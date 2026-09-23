import type { Metadata, Viewport } from "next";
import {
  Cormorant_Garamond,
  Playfair_Display,
  Great_Vibes,
  EB_Garamond,
  Manrope,
} from "next/font/google";
import "./globals.css";

// Beberapa pilihan font nama pengantin buat dipilih admin (lihat
// FontFamilyPicker) — semua di-load statis di sini (next/font/google emang
// wajib begitu), masing-masing dapat CSS variable sendiri, dipakai kondisional
// lewat wedding.titleFontFamily.
const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-display",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-playfair",
});

const greatvibes = Great_Vibes({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-greatvibes",
});

const ebgaramond = EB_Garamond({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-ebgaramond",
});

const body = Manrope({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-body",
});

// TODO: ganti dengan domain asli begitu sudah pakai custom domain (bukan *.vercel.app)
const SITE_URL = "https://miori-booth-virtual.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "MioriBooth Virtual — Photobooth Virtual untuk Wedding",
    template: "%s · MioriBooth Virtual",
  },
  description:
    "Photobooth virtual untuk wedding: tamu scan QR, ambil foto/video, tinggalkan pesan suara, dan langsung dapat frame siap dibagikan ke story. Kenangan tersimpan rapi untuk pengantin.",
  keywords: [
    "photobooth virtual",
    "photobooth wedding",
    "digital photobooth pernikahan",
    "MioriBooth",
    "vendor wedding",
  ],
  openGraph: {
    type: "website",
    locale: "id_ID",
    url: SITE_URL,
    siteName: "MioriBooth Virtual",
    title: "MioriBooth Virtual — Photobooth Virtual untuk Wedding",
    description:
      "Tamu scan QR, ambil foto/video, tinggalkan pesan suara — langsung jadi kenangan berbingkai untuk pengantin.",
  },
  twitter: {
    card: "summary_large_image",
    title: "MioriBooth Virtual — Photobooth Virtual untuk Wedding",
    description:
      "Tamu scan QR, ambil foto/video, tinggalkan pesan suara — langsung jadi kenangan berbingkai untuk pengantin.",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // viewportFit "cover" wajib supaya env(safe-area-inset-*) di CSS bisa
  // kebaca beneran di iPhone (notch/home-indicator) — tanpa ini, nilainya
  // selalu 0 dan tombol di bagian bawah layar booth bisa ketutup area itu.
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body className={`${cormorant.variable} ${playfair.variable} ${greatvibes.variable} ${ebgaramond.variable} ${body.variable}`}>{children}</body>
    </html>
  );
}
