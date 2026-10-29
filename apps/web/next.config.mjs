/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: [
    '@sllas/contracts',
    '@sllas/validation',
    '@sllas/design-tokens',
    '@sllas/api-client',
  ],
};

export default nextConfig;
