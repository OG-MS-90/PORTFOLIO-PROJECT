/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: ['localhost', 'lh3.googleusercontent.com', 'avatars.githubusercontent.com', 'images.unsplash.com'],
  },
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_ESOP_BASE_CURRENCY: process.env.NEXT_PUBLIC_ESOP_BASE_CURRENCY,
    NEXT_PUBLIC_USD_INR_RATE: process.env.NEXT_PUBLIC_USD_INR_RATE,
  },
}

module.exports = nextConfig
