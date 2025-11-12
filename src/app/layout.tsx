import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/theme/theme-provider";
import { OrganizationStoreProvider } from "@/zustand/providers/organization-store-provider";
import { IntegrationsStoreProvider } from "@/zustand/providers/integrations-store-provider";
import { DashboardStoreProvider } from "@/zustand/providers/dashboard-store-provider";

const geistSans = Geist({
	variable: "--font-geist-sans",
	subsets: ["latin"],
});

const geistMono = Geist_Mono({
	variable: "--font-geist-mono",
	subsets: ["latin"],
});

export const metadata: Metadata = {
	title: "Builders' Stack: SaaS Dashboard for Indie Founders",
	description:
		"Unify your SaaS stack with Builders' Stack—dashboard for indie founders with 20+ integrations like GitHub, Jira, and Stripe. Start now!",
	keywords: [
		"SaaS dashboard",
		"indie founders",
		"integrations",
		"free SaaS tool",
		"GitHub",
		"Jira",
		"Stripe",
		"Linear",
		"PostHog",
		"Slack",
	],
	openGraph: {
		title: "Builders' Stack: SaaS Dashboard for Indie Founders",
		description:
			"Unify your SaaS stack with Builders' Stack—dashboard for indie founders with 20+ integrations like GitHub, Jira, and Stripe. Start now!",
		url:
			process.env.NEXT_PUBLIC_APP_URL ||
			"https://builderstack.vercel.app",
		siteName: "Builders' Stack",
		images: [
			{
				url: "/builderstack.png", // Placeholder; replace with actual OG image path
				width: 1200,
				height: 630,
				alt: "Builders' Stack SaaS Dashboard",
			},
		],
		locale: "en_US",
		type: "website",
	},
	twitter: {
		card: "summary_large_image",
		title: "Builders' Stack: SaaS Dashboard for Indie Founders",
		description:
			"Unify your SaaS stack with Builders' Stack—dashboard for indie founders with 20+ integrations like GitHub, Jira, and Stripe. Start now!",
		images: ["/builderstack.png"], // Placeholder; replace with actual image path
		creator: "@Oseni03",
	},
	robots: {
		index: true,
		follow: true,
		googleBot: {
			index: true,
			follow: true,
			"max-video-preview": -1,
			"max-image-preview": "large",
			"max-snippet": -1,
		},
	},
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en" suppressHydrationWarning>
			<body
				className={`${geistSans.variable} ${geistMono.variable} antialiased`}
			>
				<ThemeProvider>
					<OrganizationStoreProvider>
						<IntegrationsStoreProvider>
							<DashboardStoreProvider>
								{children}
							</DashboardStoreProvider>
						</IntegrationsStoreProvider>
					</OrganizationStoreProvider>
					<Toaster />
				</ThemeProvider>
			</body>
		</html>
	);
}
