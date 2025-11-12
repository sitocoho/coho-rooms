/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'data',
        hostname: '**',
      },
    ],
  },
}

module.exports = nextConfig
