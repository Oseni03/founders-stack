"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, LucideIcon } from "lucide-react";
import { icons } from "lucide-react";

interface ComingSoonCategoryProps {
	category: string;
	description: string;
	iconName: keyof typeof icons; // Use icon name as a string
}

export default function ComingSoonCategoryPage({
	category,
	description,
	iconName,
}: ComingSoonCategoryProps) {
	const Icon = icons[iconName] as LucideIcon; // Dynamically select the icon

	if (!Icon) {
		console.warn(`Icon "${iconName}" not found in lucide-react`);
		return null; // Fallback if icon is invalid
	}

	return (
		<main className="min-h-screen bg-gradient-to-b from-background to-muted flex items-center justify-center p-4">
			<div className="max-w-3xl w-full text-center space-y-8">
				{/* Header with Back Button */}
				<div className="flex items-center justify-between">
					<Link href="/dashboard">
						<Button
							variant="ghost"
							size="icon"
							aria-label="Back to dashboard"
						>
							<ArrowLeft className="h-5 w-5" />
						</Button>
					</Link>
					<div className="flex-1 text-center">
						<h1 className="text-4xl sm:text-5xl font-bold text-foreground">
							{category} Coming Soon!
						</h1>
						<p className="mt-4 text-lg sm:text-xl text-muted-foreground">
							{description}
						</p>
					</div>
					<div className="w-12" /> {/* Spacer for alignment */}
				</div>

				{/* Announcement Card */}
				<Card className="bg-card/80 backdrop-blur-sm">
					<CardHeader>
						<CardTitle className="flex items-center justify-center gap-2">
							<Icon className="h-5 w-5 text-chart-1" />
							Built for Founders & Solopreneurs
						</CardTitle>
					</CardHeader>
					<CardContent>
						<p className="text-muted-foreground mb-4">
							Our new {category.toLowerCase()} category will
							empower you to streamline your operations and focus
							on growth. Stay tuned for tools designed to make
							your entrepreneurial journey smoother.
						</p>
						<Link href="/dashboard">
							<Button className="flex items-center gap-2">
								Explore Existing Features
								<ArrowLeft className="h-4 w-4 transform rotate-180" />
							</Button>
						</Link>
					</CardContent>
				</Card>

				{/* Social Links */}
				<div className="mt-8">
					<p className="text-muted-foreground">
						Stay updated on our progress:
					</p>
					<div className="flex justify-center gap-4 mt-2">
						<a
							href="https://twitter.com"
							target="_blank"
							rel="noopener noreferrer"
							className="text-muted-foreground hover:text-foreground"
							aria-label="Follow us on Twitter"
						>
							<svg
								className="h-6 w-6"
								fill="currentColor"
								viewBox="0 0 24 24"
							>
								<path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
							</svg>
						</a>
						<a
							href="https://linkedin.com"
							target="_blank"
							rel="noopener noreferrer"
							className="text-muted-foreground hover:text-foreground"
							aria-label="Follow us on LinkedIn"
						>
							<svg
								className="h-6 w-6"
								fill="currentColor"
								viewBox="0 0 24 24"
							>
								<path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.32 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.79M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z" />
							</svg>
						</a>
					</div>
				</div>
			</div>
		</main>
	);
}
