import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	/* config options here */
	images: {
		domains: ["avatars.githubusercontent.com"],
	},
	// allowedDevOrigins: ["local-origin.dev", "*.local-origin.dev"],
};

export default nextConfig;
