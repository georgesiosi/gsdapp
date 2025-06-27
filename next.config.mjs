/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    optimizeCss: true,
    esmExternals: true,
    forceSwcTransforms: true,
    webpackBuildWorker: true,
    // Add new optimizations
    optimizePackageImports: ['@/components', '@/hooks'],
  },
  webpack: (config, { isServer }) => {
    // Enable detailed module resolution logs
    config.infrastructureLogging = {
      level: 'verbose',
      debug: true
    };

    // Add additional module resolution paths
    if (!config.resolve.modules) {
      config.resolve.modules = [];
    }

    config.resolve.modules.push(
      '.',
      './components',
      './app',
      './hooks',
      './lib',
      './services'
    );

    // Ensure proper handling of TypeScript paths
    if (!config.resolve.alias) {
      config.resolve.alias = {};
    }

    Object.assign(config.resolve.alias, {
      '@': '.',
      '@/components': './components',
      '@/app': './app',
      '@/hooks': './hooks',
      '@/lib': './lib',
      '@/services': './services',
      '@/components/ui': './components/ui',
      '@/components/ideas/hooks': './components/ideas/hooks',
      '@/components/task/hooks': './components/task/hooks'
    });

    return config;
  },
  env: {
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  },
  // Enable ESLint and TypeScript checks during builds for better quality
  eslint: {
    ignoreDuringBuilds: false,
  },
  typescript: {
    ignoreBuildErrors: false,
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
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        source: "/sw.js",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=0, must-revalidate",
          },
        ],
      },
      {
        source: "/manifest.json",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=0, must-revalidate",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
