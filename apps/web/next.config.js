const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  outputFileTracingRoot: path.join(__dirname, '../../'),
  transpilePackages: [
    '@workhub/design-tokens',
    '@workhub/ui',
    '@workhub/contracts',
    '@workhub/api-client',
  ],
};

module.exports = nextConfig;
