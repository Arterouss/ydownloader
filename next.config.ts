import type { NextConfig } from "next";

const isMobileExport = process.env.NEXT_EXPORT === "true";

const nextConfig: NextConfig = {
  output: isMobileExport ? "export" : "standalone",
  images: {
    unoptimized: isMobileExport ? true : false,
    remotePatterns: [
      { protocol: "https", hostname: "**" },
      { protocol: "http", hostname: "**" },
    ],
  },
};

export default nextConfig;
