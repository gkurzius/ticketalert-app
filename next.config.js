/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.seatgeek.com',
      },
      {
        protocol: 'https',
        hostname: 'seatgeek.com',
      },
      {
        protocol: 'https',
        hostname: '*.s-nbcnews.com',
      },
      {
        protocol: 'https',
        hostname: 'bandsintown.com',
      },
      {
        protocol: 'https',
        hostname: '*.bandsintown.com',
      },
    ],
  },
}

module.exports = nextConfig
