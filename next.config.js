const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');

/** @type {import('next').NextConfig} */

const nextConfig = {
  reactStrictMode: true,
  webpack: (config) => {
    config.plugins.push(
      new CopyPlugin({
        patterns: [
          {
            from: 'node_modules/leaflet/dist/images',
            to: path.resolve(__dirname, 'public', 'leaflet', 'images')
          },
        ],
      }),
    )
    return config
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        // destination: 'http://labai.polinema.ac.id:9800/api/:path*'
        destination: 'http://192.168.60.110:98/api/:path*'
      },
      {
        source: '/grafana/:path*',
        destination: 'http://192.168.60.110:3300/:path*'
      }
    ]
  }
}

module.exports = nextConfig;
