/** @type {import('next').NextConfig} */
const config = {
  output: "export",
  assetPrefix: ".",
  trailingSlash: false,
  images: { unoptimized: true },
  poweredByHeader: false,
  reactStrictMode: true,
  experimental: { cpus: 2 },
  webpack(config) {
    config.resolve.alias["@"] = process.cwd();
    return config;
  },
};
export default function nextConfig(phase) {
  if (phase === "phase-development-server") {
    return {
      ...config,
      output: undefined,
      async rewrites() {
        return ["estudos", "redacao", "radar"].map((route) => ({
          source: `/${route}.html`,
          destination: `/${route}`,
        }));
      },
    };
  }
  return config;
}
