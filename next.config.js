/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Enable more accurate module resolution
    esmExternals: true,
    // Ensure proper handling of path aliases
    forceSwcTransforms: true,
    // Enable module resolution tracing for debugging
    moduleResolution: 'node',
    // Enable more verbose webpack output
    webpackBuildWorker: true
  },
  webpack: (config, { isServer }) => {
    // Enable detailed module resolution logs
    config.infrastructureLogging = {
      level: 'verbose',
      debug: true
    };

    // Add additional module resolution paths
    config.resolve.modules.push(
      './components',
      './components/ideas/hooks',
      './components/task/hooks'
    );

    // Ensure proper handling of TypeScript paths
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': '.',
      '@/components': './components',
      '@/hooks': './components/*/hooks'
    };

    return config;
  },
  reactStrictMode: true,
  // Disable ESLint and TypeScript checks during builds
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  // Configure headers to allow service worker registration
  headers: async () => {
    return [
      {
        source: "/sw.js",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=0, must-revalidate",
          },
        ],
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'img.clerk.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

module.exports = nextConfig;
