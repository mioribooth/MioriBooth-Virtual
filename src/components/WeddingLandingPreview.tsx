"use client";

// Sengaja import langsung landing.css yang dipakai halaman awal booth tamu
// beneran (src/app/w/[slug]/page.tsx) — bukan nulis ulang style-nya di sini.
// Jadi preview ini DIJAMIN selalu sama persis kayak yang bakal dilihat tamu,
// gak akan "kelewatan" kalau landing.css diubah lagi nanti.
import "../app/w/[slug]/landing.css";
import { orderNames } from "@/lib/nameOrder";
import { getTitleFont } from "@/lib/titleFonts";

export interface WeddingLandingPreviewProps {
  groomName: string;
  brideName: string;
  nameOrder: string;
  eventDateLabel: string;
  welcomeText: string;
  coverImageUrl: string | null;
  coverPosX: number;
  coverPosY: number;
  coverScale: number;
  titleFontScale: number;
  titleFontFamily: string;
  theme?: "BURGUNDY" | "SKY_BLUE";
}

// Tinggi mock frame-nya (px) — dipakai juga buat itung ulang .landing-cover
// max-height (yang di landing.css aslinya pakai satuan vh, artinya nempel ke
// tinggi LAYAR BENERAN, bukan tinggi kotak preview kecil ini; jadi di sini
// di-override manual pakai px biar proporsinya tetap masuk akal di kotak
// preview yang kecil).
const PREVIEW_HEIGHT = 560;

export default function WeddingLandingPreview({
  groomName,
  brideName,
  nameOrder,
  eventDateLabel,
  welcomeText,
  coverImageUrl,
  coverPosX,
  coverPosY,
  coverScale,
  titleFontScale,
  titleFontFamily,
  theme = "BURGUNDY",
}: WeddingLandingPreviewProps) {
  const themeClass = theme === "SKY_BLUE" ? "theme-sky-blue" : "theme-burgundy";
  const [firstName, secondName] = orderNames(
    groomName || "Nama Pria",
    brideName || "Nama Wanita",
    nameOrder
  );
  const titleFont = getTitleFont(titleFontFamily);

  return (
    <div className={themeClass}>
      <div
        className="booth-shell landing-shell"
        style={{
          height: PREVIEW_HEIGHT,
          minHeight: PREVIEW_HEIGHT,
          maxWidth: 280,
          margin: "0 auto",
          borderRadius: 28,
          overflow: "hidden",
          border: "8px solid #14141c",
          boxShadow: "0 20px 45px rgba(0,0,0,0.35)",
        }}
      >
        <div className="landing-cover" style={{ maxHeight: PREVIEW_HEIGHT * 0.34 }}>
          {coverImageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={coverImageUrl}
              alt={`${groomName || "Pengantin Pria"} & ${brideName || "Pengantin Wanita"}`}
              style={{
                objectPosition: `${coverPosX}% ${coverPosY}%`,
                transform: `scale(${coverScale})`,
              }}
            />
          ) : (
            <div className="landing-cover-placeholder" />
          )}
          <div className="landing-cover-fade" />
        </div>

        <div className="booth-content landing-content">
          <span className="eyebrow">Wedding Memories Of</span>
          <h1
            className="font-display landing-title"
            style={{
              fontSize: `${30 * titleFontScale}px`,
              fontFamily: titleFont.cssVar,
              fontStyle: titleFont.italic ? "italic" : "normal",
            }}
          >
            {firstName}
            <span className="landing-amp" style={{ fontSize: `${18 * titleFontScale}px` }}>
              &amp;
            </span>
            {secondName}
          </h1>
          <p className="muted landing-date">{eventDateLabel || "Tanggal acara"}</p>
          <p className="muted landing-welcome">
            {welcomeText || "Tinggalkan foto dan pesan suara terbaikmu untuk kami kenang selamanya."}
          </p>
          <div className="landing-cta-wrap">
            <button type="button" className="btn btn-primary btn-block" disabled>
              Mulai Booth
            </button>
          </div>
        </div>
      </div>
      <p className="muted" style={{ textAlign: "center", fontSize: 12, marginTop: 10 }}>
        Live preview — halaman awal yang dilihat tamu
      </p>
    </div>
  );
}
