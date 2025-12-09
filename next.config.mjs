/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  images: {
    // On désactive l'optimisation intégrée pour éviter les erreurs 400/500
    // liées au domaine des URLs de screenshots (MinIO/S3).
    // Le composant <Image> reste utilisé (ESLint OK), mais se comporte
    // comme un <img> classique côté client.
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '9000',
        pathname: '/**',
      },
    ],
  },
  webpack(config) {
    config.experiments = { ...config.experiments, topLevelAwait: true };
    return config;
  },
};

export default nextConfig;