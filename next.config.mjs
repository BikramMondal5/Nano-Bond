/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },

  webpack: (config, { isServer, webpack }) => {
    // Exclude problematic test files from thread-stream
    config.module.rules.push({
      test: /node_modules[\\/]thread-stream[\\/](test|bench\.js)/,
      use: 'ignore-loader'
    });

    // Exclude README and LICENSE files that cause parsing errors
    config.module.rules.push({
      test: /node_modules[\\/]thread-stream[\\/](README\.md|LICENSE)/,
      use: 'ignore-loader'
    });

    // Exclude client components packages from server bundle
    if (isServer) {
      config.externals.push({
        'pino': 'commonjs pino',
        'thread-stream': 'commonjs thread-stream',
      });
    }

    // Add fallbacks
    config.resolve.fallback = {
      ...config.resolve.fallback,
      'tap': false,
      'tape': false,
      'desm': false,
      'fastbench': false,
      'pino-elasticsearch': false,
      'why-is-node-running': false,
      '@react-native-async-storage/async-storage': false,
    };

    // Add alias to handle the module resolution
    config.resolve.alias = {
      ...config.resolve.alias,
      '@react-native-async-storage/async-storage': false,
    };

    return config;
  },
}

export default nextConfig