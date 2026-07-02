import { ImageResponse } from "next/og";

export const size = {
  width: 1200,
  height: 630
};

export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 56,
          color: "#eef5f0",
          background:
            "radial-gradient(circle at 15% 20%, rgba(76,157,123,0.35), transparent 30%), radial-gradient(circle at 88% 16%, rgba(213,169,78,0.24), transparent 24%), linear-gradient(160deg, #0d1714, #12201b 48%, #0a120f)"
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "14px 22px",
            borderRadius: 999,
            border: "1px solid rgba(213,169,78,0.35)",
            background: "rgba(213,169,78,0.08)",
            color: "#f0d08b",
            fontSize: 24,
            letterSpacing: 4,
            textTransform: "uppercase"
          }}
        >
          Uzbekistan Billiards Ecosystem
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 18, maxWidth: 860 }}>
          <div style={{ fontSize: 88, fontWeight: 700, lineHeight: 0.9, letterSpacing: 2 }}>Bill4</div>
          <div style={{ fontSize: 34, lineHeight: 1.3, color: "#c8d5cf" }}>
            Live tournaments, premium clubs, player rankings, and full tournament centers with real brackets.
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <div style={{ display: "flex", gap: 16 }}>
            {["Live brackets", "Tournament centers", "Players and clubs"].map((label) => (
              <div
                key={label}
                style={{
                  borderRadius: 18,
                  border: "1px solid rgba(255,255,255,0.12)",
                  background: "rgba(255,255,255,0.04)",
                  padding: "16px 20px",
                  fontSize: 22,
                  color: "#eef5f0"
                }}
              >
                {label}
              </div>
            ))}
          </div>
          <div style={{ fontSize: 28, color: "#9fb1a8" }}>bill4.uz</div>
        </div>
      </div>
    ),
    size
  );
}
