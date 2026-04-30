/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    typedRoutes: false
  },
  async redirects() {
    return [
      { source: "/jobs", destination: "/projects", permanent: true },
    ];
  },
  async headers() {
    return [
      {
        source: "/",
        headers: [{ key: "X-Robots-Tag", value: "index, noarchive" }],
      },
      {
        source: "/api/catalog",
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
      },
      {
        source: "/api/match",
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
      },
      {
        source: "/api/atoa/:path*",
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
      },
      {
        source: "/api/note/:path*",
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow, noarchive, nosnippet" }],
      },
      {
        source: "/asset/:path*",
        headers: [{ key: "X-Robots-Tag", value: "index, noarchive, max-snippet:140" }],
      },
    ];
  },
};

module.exports = nextConfig;
