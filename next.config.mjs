/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    // @node-rs/argon2 ships a native binary per platform; keep it external so
    // webpack doesn't try to parse the .node file as a module.
    serverComponentsExternalPackages: ["@node-rs/argon2"],
  },
};

export default nextConfig;