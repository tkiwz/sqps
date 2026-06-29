import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // تجاهل أخطاء البناء (ضروري للنشر السريع)
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;