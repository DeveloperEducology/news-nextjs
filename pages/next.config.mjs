/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  reactCompiler: true,
  reactStrictMode: true,

  // --- ADD THIS 'images' SECTION ---
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cakeimages.s3.ap-northeast-2.amazonaws.com',
      },
      // You should also add your placeholder domain
      {
        protocol: 'https',
        hostname: 'via.placeholder.com',
      },
      
    ],
  },
  // --- END OF SECTION ---
};

export default nextConfig;