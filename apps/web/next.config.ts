import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@devspace/contracts', 'three', '@react-three/fiber', '@react-three/drei'],
  reactStrictMode: true,
};

export default nextConfig;
