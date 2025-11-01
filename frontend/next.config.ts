import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  images: {
    unoptimized: true,
  },
  trailingSlash: true,
  env: {
    // Use port 8000 for development, 8001 for production to avoid conflicts
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL ||
      (process.env.NODE_ENV === 'development'
        ? 'http://localhost:8000/api'
        : 'http://localhost:8001/api'),
  },
};

export default nextConfig;
