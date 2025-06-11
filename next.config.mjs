/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  reactStrictMode: false,
  images: {
    unoptimized: true
  },
  // Para Tauri
  assetPrefix: process.env.NODE_ENV === 'production' ? './' : '',
  // Desabilitar telemetría
  telemetry: false
}

module.exports = nextConfig
