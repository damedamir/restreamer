/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  experimental: {
    outputFileTracingRoot: undefined,
  },
  images: {
    unoptimized: true,
  },
  serverRuntimeConfig: {
    hostname: "0.0.0.0",
    port: 3000,
  },
  publicRuntimeConfig: {
    hostname: "0.0.0.0",
    port: 3000,
  },
}

module.exports = nextConfig
