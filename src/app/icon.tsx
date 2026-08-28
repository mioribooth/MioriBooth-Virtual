import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#142338",
          borderRadius: "50%",
          fontFamily: "serif",
        }}
      >
        <span style={{ color: "#bcd4ea", fontSize: 20, fontStyle: "italic" }}>M</span>
      </div>
    ),
    { ...size }
  );
}
