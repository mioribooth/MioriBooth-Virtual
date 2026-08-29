import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(160deg, #9c2a45 0%, #2f0512 100%)",
          fontFamily: "serif",
        }}
      >
        <span style={{ color: "#d9bd8a", fontSize: 96, fontStyle: "italic" }}>M</span>
      </div>
    ),
    { ...size }
  );
}
