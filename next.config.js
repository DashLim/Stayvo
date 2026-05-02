/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  allowedDevOrigins: ['192.168.100.101'],
  // Turbopack defaults to on-disk SST cache in dev; on some setups this races/compacts badly (ENOENT .sst).
  experimental: {
    turbopackFileSystemCacheForDev: false,
  },
  // Next 16 defaults to Turbopack for `next build`; empty config acknowledges we also define webpack() for dev.
  turbopack: {},
  // Avoid flaky webpack pack cache on some machines (ENOENT rename / missing chunks).
  // Dev may compile a bit slower; production builds are unchanged.
  webpack: (config, { dev }) => {
    if (dev) {
      // Disk cache races → ENOENT / missing manifests (see prior issues).
      config.cache = false;
      // Avoid split vendor chunks in dev; missing `./vendor-chunks/@supabase.js`
      // happens when worker compilation references chunks not yet written.
      config.optimization = {
        ...config.optimization,
        splitChunks: false,
      };
    }
    return config;
  },
};

module.exports = nextConfig;

