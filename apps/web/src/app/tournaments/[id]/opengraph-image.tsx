import { ImageResponse } from "next/og";
import type { RawTournament } from "@/lib/api/contracts";
import { fetchPublicSeo, pickSeoText } from "@/lib/seo";

export const size = {
  width: 1200,
  height: 630
};

export const contentType = "image/png";

export default async function TournamentOpenGraphImage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const tournament = await fetchPublicSeo<RawTournament>(`/tournaments/${id}`);
  const title = pickSeoText(tournament?.title, "en") || "Tournament center";
  const club = pickSeoText(tournament?.clubPreview?.name ?? tournament?.club?.name, "en") || "Bill4";
  const status = String(tournament?.status ?? "registration").toUpperCase();
  const city = tournament?.cityKey ? tournament.cityKey.replace(/^[a-z]/, (value) => value.toUpperCase()) : "Uzbekistan";
  const subtitle = `${club} • ${city} • Live bracket, participants, schedule, regulation, and results.`;

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
            "radial-gradient(circle at 15% 20%, rgba(76,157,123,0.34), transparent 30%), radial-gradient(circle at 85% 10%, rgba(213,169,78,0.24), transparent 24%), linear-gradient(160deg, #0d1714, #12201b 50%, #0a120f)"
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "14px 22px",
              borderRadius: 999,
              border: "1px solid rgba(255,255,255,0.14)",
              background: "rgba(255,255,255,0.05)",
              fontSize: 24,
              letterSpacing: 4,
              textTransform: "uppercase"
            }}
          >
            Tournament Center
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "12px 18px",
              borderRadius: 999,
              border: "1px solid rgba(213,169,78,0.28)",
              background: "rgba(213,169,78,0.1)",
              color: "#f0d08b",
              fontSize: 22,
              letterSpacing: 2
            }}
          >
            {status}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 20, maxWidth: 940 }}>
          <div style={{ display: "flex", fontSize: 78, fontWeight: 700, lineHeight: 0.9 }}>{title}</div>
          <div style={{ display: "flex", fontSize: 30, lineHeight: 1.3, color: "#c8d5cf" }}>{subtitle}</div>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <div style={{ display: "flex", gap: 16 }}>
            {["Bracket", "Participants", "Results"].map((label) => (
              <div
                key={label}
                style={{
                  display: "flex",
                  borderRadius: 18,
                  border: "1px solid rgba(255,255,255,0.12)",
                  background: "rgba(255,255,255,0.04)",
                  padding: "16px 20px",
                  fontSize: 22
                }}
              >
                {label}
              </div>
            ))}
          </div>
          <div style={{ display: "flex", fontSize: 28, color: "#9fb1a8" }}>Bill4</div>
        </div>
      </div>
    ),
    size
  );
}
