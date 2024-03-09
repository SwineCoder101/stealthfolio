/** @type {import('next').NextConfig} */
const nextConfig = {
    async redirects() {
      return [
        {
          source: "/",
          destination: "/transact",
          permanent: true,
        },
      ];
    },
  };

export default nextConfig;
