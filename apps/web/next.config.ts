import type { NextConfig } from "next";
import path from "path";

const internalApiUrl = process.env.INTERNAL_API_URL ?? "http://localhost:4000/api";

const nextConfig: NextConfig = {
  output: "standalone",
  outputFileTracingRoot: path.join(__dirname, "../../"),
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${internalApiUrl.replace(/\/$/, "")}/:path*`
      }
    ];
  },
  async headers() {
    // Brand assets must never be cached by the browser: they get redrawn often
    // and a stale copy shows the wrong/old logo. Force a fresh fetch every load.
    return [
      {
        source: "/brand/:path*",
        headers: [{ key: "Cache-Control", value: "no-store, must-revalidate" }]
      },
      {
        source: "/icon.png",
        headers: [{ key: "Cache-Control", value: "no-store, must-revalidate" }]
      }
    ];
  }
};

export default nextConfig;
