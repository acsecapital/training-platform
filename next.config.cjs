/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['firebasestorage.googleapis.com', 'videodelivery.net', 'imagedelivery.net', 'storage.googleapis.com', 'via.placeholder.com'],
},
  webpack: (config) => {
    config.resolve.fallback = {
      fs: false,
      path: false,
      net: false,
      tls: false,
      dns: false,
      child_process: false,
      http2: false,
      process: false,
      stream: false,
      zlib: false,
      util: false,
      crypto: false,
      url: false,
      os: false,
      https: false,
      http: false,
      querystring: false
  };
    return config;
},
  // Add security headers
  async headers() {
    return [
      {
        // Apply these headers to all routes
        source: '/:path*',
        headers: [
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin-allow-popups',
        },
        ],
    },
    ];
},
};

module.exports = nextConfig;
