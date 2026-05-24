/** @type {import('next').NextConfig} */
const nextConfig = {
  // Required for the Docker multi-stage build to produce a minimal standalone server
  output: "standalone",
};

module.exports = nextConfig;
