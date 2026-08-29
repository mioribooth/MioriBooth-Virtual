import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(160deg, #2f0512 0%, #1a0208 100%)",
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: -80,
            left: -60,
            width: 340,
            height: 340,
            borderRadius: "50%",
            background: "#9c2a45",
            opacity: 0.5,
            filter: "blur(10px)",
            display: "flex",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: -100,
            right: -60,
            width: 300,
            height: 300,
            borderRadius: "50%",
            background: "#d9bd8a",
            opacity: 0.25,
            filter: "blur(10px)",
            display: "flex",
          }}
        />

        <span
          style={{
            color: "#d9bd8a",
            fontSize: 22,
            letterSpacing: 4,
            textTransform: "uppercase",
            marginBottom: 18,
          }}
        >
          Photobooth Virtual untuk Wedding
        </span>
        <span
          style={{
            color: "#faf6f4",
            fontSize: 76,
            fontStyle: "italic",
            fontFamily: "serif",
          }}
        >
          MioriBooth Virtual
        </span>
        <span style={{ color: "rgba(246,249,252,0.75)", fontSize: 26, marginTop: 22 }}>
          Scan QR · Foto &amp; Video · Pesan Suara · Live Slideshow
        </span>
      </div>
    ),
    { ...size }
  );
}
