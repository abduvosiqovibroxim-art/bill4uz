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
  }
};

export default nextConfig;
