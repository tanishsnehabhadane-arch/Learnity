import type { NextConfig } from "next";
import createSerwist from "@serwist/next";
import createNextIntlPlugin from "next-intl/plugin";

const withSerwist = createSerwist({
  swSrc: "src/app/sw.ts",
  swDest: "public/sw.js",
  // SW only in production builds; keeps `next dev` fast and cache-free
  disable: process.env.NODE_ENV !== "production",
});

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    formats: ["image/avif", "image/webp"],
  },
};

export default withSerwist(withNextIntl(nextConfig));
