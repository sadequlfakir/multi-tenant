/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Allow subdomain requests in dev (e.g. shop.localhost:3000, myecom.localhost:3000)
  allowedDevOrigins: ['localhost', '*.localhost'],
  webpack: (config, { dev, isServer }) => {
    // Use deterministic chunk/module IDs so dev server doesn't reference stale chunk numbers (e.g. 1590.js)
    if (dev) {
      config.optimization = config.optimization || {}
      config.optimization.moduleIds = 'deterministic'
      config.optimization.chunkIds = 'deterministic'
    }
    return config
  },
}

module.exports = nextConfig

