import type { Metadata } from "next";
import { Cormorant_Garamond, Manrope } from "next/font/google";
import "./globals.css";

const display = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-display",
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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body className={`${display.variable} ${body.variable}`}>{children}</body>
    </html>
  );
}
