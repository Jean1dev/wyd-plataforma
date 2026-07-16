import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "imagedelivery.net",
        pathname: "/kn1S83YLYaEJFOrZvTLCrw/**",
      },
    ],
  },
};

export default nextConfig;
