/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Allow subdomain requests in dev (e.g. shop.localhost:3000, myecom.localhost:3000)
  allowedDevOrigins: ['localhost', '*.localhost'],
}

module.exports = nextConfig

