import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === "production";

const nextConfig: NextConfig = {
  output: isProd ? "export" : undefined,
  rewrites: isProd
    ? undefined
    : async () => [
        {
          source: "/api/:path*",
          destination: "https://v3-test.konarobinson.com/api/:path*",
        },
      ],
};

export default nextConfig;
