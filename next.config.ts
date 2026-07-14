import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	allowedDevOrigins: [
		"localhost",
		"127.0.0.1",
		"10.158.112.181",
		"*.local",
	],
	turbopack: {
		root: __dirname,
	},
	images: {
		remotePatterns: [
			{ protocol: "https", hostname: "lh3.googleusercontent.com" },
			{ protocol: "https", hostname: "firebasestorage.googleapis.com" },
		],
		unoptimized: true,
	},
};

export default nextConfig;