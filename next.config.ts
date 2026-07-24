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
	// Empêche Next.js de bundler ces packages côté serveur (nécessaire pour
	// firebase-admin qui utilise jwks-rsa/jose en ESM — incompatible avec
	// le bundling CommonJS de Next.js en production serverless Vercel)
	serverExternalPackages: ["firebase-admin", "jose", "jwks-rsa"],
	// Header nécessaire pour que la popup Google OAuth fonctionne
	// Cross-Origin-Opener-Policy bloque window.closed si la valeur est 'same-origin'
	// 'same-origin-allow-popups' permet à la popup de communiquer avec la fenêtre parente
	async headers() {
		return [
			{
				source: '/:path*',
				headers: [
					{
						key: 'Cross-Origin-Opener-Policy',
						value: 'same-origin-allow-popups',
					},
				],
			},
		];
	},
};

export default nextConfig;