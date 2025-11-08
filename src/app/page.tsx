"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/ui/logo";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";
import { Hero } from "@/components/homepage/hero";
import { Stats } from "@/components/homepage/stats";
import { FeatureGrid } from "@/components/homepage/feature-grid";
import { FeatureShowcase } from "@/components/homepage/feature-showcase";
import { Testimonials } from "@/components/homepage/testimonials";
import { CTA } from "@/components/homepage/CTA";
import { Footer } from "@/components/homepage/footer";

const Page = () => {
	const { data: session } = authClient.useSession();
	const router = useRouter();

	const handleSignOut = async () => {
		try {
			toast.loading("Signing out");
			await authClient.signOut();
			toast.dismiss();
			toast.success("Signed out");
			router.push("/");
		} catch (error) {
			console.error("Error signing out: ", error);
			toast.dismiss();
			toast.error("Error signing out");
		}
	};

	const isAuthenticated = useMemo(() => {
		return !!session?.user;
	}, [session]);

	return (
		<div className="flex min-h-screen flex-col bg-background px-4 sm:px-6 lg:px-8">
			{/* Header */}
			<header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
				<div className="mx-auto w-full max-w-7xl h-16 flex items-center justify-between">
					<div className="flex items-center gap-2">
						<div className="w-8 h-8 rounded-lg bg-gradient-to-r from-primary to-primary/80 flex items-center justify-center">
							<Logo className="w-4 h-4 text-primary-foreground" />
						</div>
						<span className="text-xl font-bold tracking-tight">
							Builders&apos; Stack
						</span>
					</div>
					<nav className="flex items-center gap-4">
						{session?.user ? (
							<>
								<Button onClick={handleSignOut} variant="ghost">
									Sign Out
								</Button>
								<Button asChild className="font-medium">
									<Link href="/products">Dashboard</Link>
								</Button>
							</>
						) : (
							<>
								<Button variant="ghost" asChild>
									<Link href="/login">Sign In</Link>
								</Button>
								<Button asChild className="font-medium">
									<Link href="/signup">Get Started</Link>
								</Button>
							</>
						)}
					</nav>
				</div>
			</header>

			{/* Hero Section */}
			<main className="flex-1">
				<Hero isAuthenticated={isAuthenticated} />

				{/* Stats Section */}
				<Stats />

				{/* Core Features Grid */}
				<FeatureGrid />

				{/* Feature Showcase with Images */}
				<FeatureShowcase />

				{/* Testimonial Section */}
				<Testimonials />

				{/* CTA Section */}
				<CTA isAuthenticated={isAuthenticated} />
			</main>

			{/* Footer */}
			<Footer />
		</div>
	);
};

export default Page;
