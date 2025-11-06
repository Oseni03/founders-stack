"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	Shield,
	Zap,
	ArrowRight,
	Database,
	TrendingUp,
	LineChart,
	Code,
	MessageSquare,
	LayoutDashboard,
} from "lucide-react";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";

const Page = () => {
	const { data: session } = authClient.useSession();
	const router = useRouter();

	const coreFeatures = [
		{
			icon: Database,
			title: "Project Health",
			description:
				"Track tasks, velocity, and bottlenecks from Linear, Asana, and Jira in real-time",
			features: [
				"Open tasks & overdue metrics",
				"Sprint velocity trends",
				"Priority triage console",
			],
		},
		{
			icon: TrendingUp,
			title: "Financial Status",
			description:
				"Monitor MRR, churn, and revenue forecasts from Stripe and Chargebee",
			features: [
				"Real-time MRR tracking",
				"Churn analysis & alerts",
				"Revenue forecasting",
			],
		},
		{
			icon: LineChart,
			title: "User Analytics",
			description:
				"Aggregate usage data and feedback from Amplitude, Mixpanel, and Zendesk",
			features: [
				"Active user tracking",
				"Error rate monitoring",
				"Sentiment analysis",
			],
		},
		{
			icon: Code,
			title: "Development Pipeline",
			description:
				"Monitor commits, PRs, and builds from GitHub, GitLab, and CircleCI",
			features: [
				"Commit & PR metrics",
				"Build success rates",
				"Deploy timeline",
			],
		},
		{
			icon: MessageSquare,
			title: "Team Communication",
			description:
				"Aggregate messages and mentions from Slack and Discord",
			features: [
				"Message volume tracking",
				"Unread mention alerts",
				"Sentiment monitoring",
			],
		},
		{
			icon: Shield,
			title: "Enterprise Security",
			description:
				"Bank-level encryption and compliance for your sensitive data",
			features: [
				"End-to-end encryption",
				"SOC 2 compliant",
				"GDPR ready",
			],
		},
	];

	const featureShowcase = [
		{
			badge: "Real-Time Sync",
			title: "Connect Once, Sync Forever",
			description:
				"Our intelligent sync engine connects to your existing tools via OAuth and API keys. Data flows automatically every 60 seconds, ensuring you always have the latest metrics without manual updates or data exports.",
			features: [
				{
					title: "Instant Integration",
					description: "One-click OAuth for major platforms",
				},
				{
					title: "Canonical Data Model",
					description: "Normalized data across all sources",
				},
				{
					title: "Background Processing",
					description: "Zero impact on your workflow",
				},
			],
			image: "/assets/feature-sync.png",
			imageAlt: "Real-time data synchronization across platforms",
			imageOrder: "right",
		},
		{
			badge: "Smart Analytics",
			title: "Insights That Drive Decisions",
			description:
				"Our AI-powered analytics engine identifies correlations between metrics across your stack. Discover how code deploys affect user behavior, or how churn correlates with error rates—all automatically surfaced in your dashboard.",
			features: [
				{
					title: "Cross-Stack Correlation",
					description: "Find hidden patterns in your data",
				},
				{
					title: "Anomaly Detection",
					description: "Get alerted to unusual activity instantly",
				},
				{
					title: "Predictive Forecasting",
					description: "Plan ahead with confidence",
				},
			],
			image: "/assets/feature-insights.png",
			imageAlt: "Actionable insights and data analytics",
			imageOrder: "left",
		},
		{
			badge: "Enterprise Grade",
			title: "Security You Can Trust",
			description:
				"Built on enterprise-grade infrastructure with bank-level encryption. Your data never leaves secure, compliant data centers. We're SOC 2 Type II certified and GDPR compliant from day one.",
			features: [
				{
					title: "256-bit Encryption",
					description: "Both in transit and at rest",
				},
				{
					title: "Role-Based Access",
					description: "Granular permission controls",
				},
				{
					title: "Audit Logging",
					description: "Complete activity transparency",
				},
			],
			image: "/assets/feature-security.png",
			imageAlt: "Enterprise-grade security and compliance",
			imageOrder: "right",
		},
	];

	const testimonials = [
		{
			rating: 5,
			text: "Founder's Stack saved me 10 hours per week. I used to jump between 8 different tabs—now everything I need is in one place.",
			author: "Sarah Chen",
			role: "Founder, TaskFlow",
		},
		{
			rating: 5,
			text: "The correlation insights are game-changing. I discovered our churn was tied to deployment errors—something I never would have found manually.",
			author: "Michael Park",
			role: "Founder, DevMetrics",
		},
		{
			rating: 5,
			text: "As a solo founder, I can't afford to miss critical signals. Founder's Stack gives me the visibility I need without the enterprise price tag.",
			author: "Alex Rivera",
			role: "Founder, CloudSync",
		},
	];

	const stats = [
		{ value: "5+", label: "Integrated Tools" },
		{ value: "<2s", label: "Page Load Time" },
		{ value: "100%", label: "Data Privacy" },
	];

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

	return (
		<div className="flex min-h-screen flex-col bg-background px-4 sm:px-6 lg:px-8">
			{/* Header */}
			<header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
				<div className="mx-auto w-full max-w-7xl h-16 flex items-center justify-between">
					<div className="flex items-center gap-2">
						<div className="w-8 h-8 rounded-lg bg-gradient-to-r from-primary to-primary/80 flex items-center justify-center">
							<LayoutDashboard className="w-4 h-4 text-primary-foreground" />
						</div>
						<span className="text-xl font-bold tracking-tight">
							Builder&apos;s Stack
						</span>
					</div>
					<nav className="flex items-center gap-4">
						{session?.user ? (
							<>
								<Button onClick={handleSignOut} variant="ghost">
									Sign Out
								</Button>
								<Button asChild className="font-medium">
									<Link href="/dashboard">Dashboard</Link>
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
				<section className="mx-auto w-full max-w-7xl flex flex-col items-center justify-center gap-12 py-24 text-center md:py-32">
					<div className="flex max-w-4xl flex-col items-center gap-8 animate-fade-in">
						<div className="inline-block rounded-full border border-border bg-muted px-4 py-1.5 text-sm animate-scale-in">
							Single Pane of Glass for Indie Founders
						</div>

						<h1 className="text-5xl font-bold tracking-tighter sm:text-6xl md:text-7xl lg:text-8xl">
							Unify Your
							<br />
							<span className="bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
								Entire Stack
							</span>
						</h1>

						<p className="max-w-2xl text-lg text-muted-foreground sm:text-xl md:text-2xl leading-relaxed">
							Aggregate metrics from Slack, Asana, Stripe, GitHub,
							and Amplitude into one powerful command center. Stop
							context-switching. Start building.
						</p>

						<div className="flex flex-col gap-4 sm:flex-row">
							<Button
								size="lg"
								asChild
								className="text-base h-12 px-8"
							>
								<Link
									href={
										session?.user ? "/dashboard" : "/signup"
									}
								>
									{session?.user
										? "Go to Dashboard"
										: "Start Free Trial"}
									<ArrowRight className="ml-2 h-5 w-5" />
								</Link>
							</Button>
							<Button
								size="lg"
								variant="outline"
								asChild
								className="text-base h-12 px-8"
							>
								<Link href="/demo">View Demo</Link>
							</Button>
						</div>
					</div>

					{/* Hero Image */}
					<div className="w-full max-w-6xl mt-8 animate-fade-in">
						<div className="relative rounded-lg border border-border bg-card p-2 shadow-2xl hover:scale-[1.02] transition-transform duration-300">
							<div className="relative w-full aspect-video bg-muted rounded-md">
								{/* Replace with actual dashboard image */}
								<div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
									Dashboard Preview
								</div>
							</div>
						</div>
					</div>
				</section>

				{/* Stats Section */}
				<section className="border-y border-border bg-muted/30 py-16 animate-fade-in">
					<div className="mx-auto w-full max-w-7xl">
						<div className="grid gap-8 md:grid-cols-3 text-center">
							{stats.map((stat, index) => (
								<div
									key={index}
									className="flex flex-col gap-2"
								>
									<div className="text-4xl font-bold tracking-tighter">
										{stat.value}
									</div>
									<div className="text-sm text-muted-foreground uppercase tracking-wide">
										{stat.label}
									</div>
								</div>
							))}
						</div>
					</div>
				</section>

				{/* Core Features Grid */}
				<section className="mx-auto w-full max-w-7xl py-24 md:py-32">
					<div className="flex flex-col items-center gap-4 text-center mb-16 animate-fade-in">
						<h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
							Everything You Need in One Place
						</h2>
						<p className="max-w-2xl text-lg text-muted-foreground">
							Five powerful modules designed to give you complete
							visibility across your entire operation
						</p>
					</div>

					<div className="grid gap-8 md:grid-cols-2">
						{coreFeatures.map((feature, index) => (
							<Card
								key={index}
								className="border-border hover:border-foreground/20 transition-all hover:scale-105 duration-200 animate-fade-in"
								style={{
									animationDelay: `${index * 0.1}s`,
									animationFillMode: "both",
								}}
							>
								<CardHeader>
									<div className="flex h-12 w-12 items-center justify-center rounded-lg bg-foreground/5 mb-4">
										<feature.icon className="h-6 w-6 text-foreground" />
									</div>
									<CardTitle className="text-xl">
										{feature.title}
									</CardTitle>
									<CardDescription>
										{feature.description}
									</CardDescription>
								</CardHeader>
								<CardContent>
									<ul className="space-y-2 text-sm text-muted-foreground">
										{feature.features.map(
											(item, itemIndex) => (
												<li
													key={itemIndex}
													className="flex items-center gap-2"
												>
													<div className="h-1.5 w-1.5 rounded-full bg-foreground" />
													{item}
												</li>
											)
										)}
									</ul>
								</CardContent>
							</Card>
						))}
					</div>
				</section>

				{/* Feature Showcase with Images */}
				<section className="mx-auto w-full max-w-7xl py-24 md:py-32">
					<div className="mx-auto w-full max-w-7xl">
						<div className="grid gap-16 lg:gap-24">
							{featureShowcase.map((feature, index) => (
								<div
									key={index}
									className={`grid gap-8 lg:grid-cols-2 lg:gap-16 items-center animate-fade-in`}
								>
									<div
										className={
											feature.imageOrder === "right"
												? "order-2 lg:order-1"
												: "order-2"
										}
									>
										<div className="inline-block rounded-full border border-border bg-background px-3 py-1 text-xs uppercase tracking-wide mb-4">
											{feature.badge}
										</div>
										<h3 className="text-3xl font-bold tracking-tighter mb-4">
											{feature.title}
										</h3>
										<p className="text-lg text-muted-foreground mb-6 leading-relaxed">
											{feature.description}
										</p>
										<ul className="space-y-3">
											{feature.features.map(
												(item, itemIndex) => (
													<li
														key={itemIndex}
														className="flex items-start gap-3"
													>
														<Zap className="h-5 w-5 mt-0.5 flex-shrink-0" />
														<div>
															<div className="font-medium">
																{item.title}
															</div>
															<div className="text-sm text-muted-foreground">
																{
																	item.description
																}
															</div>
														</div>
													</li>
												)
											)}
										</ul>
									</div>
									<div
										className={
											feature.imageOrder === "right"
												? "order-1 lg:order-2"
												: "order-1"
										}
									>
										<div className="relative rounded-lg border border-border bg-background p-8 hover:scale-105 transition-transform duration-300">
											<div className="relative w-full aspect-video bg-muted rounded-md">
												{/* Replace with actual feature images */}
												<div className="absolute inset-0 flex items-center justify-center text-muted-foreground text-sm">
													{feature.imageAlt}
												</div>
											</div>
										</div>
									</div>
								</div>
							))}
						</div>
					</div>
				</section>

				{/* Testimonial Section */}
				<section className="mx-auto w-full max-w-7xl py-24 md:py-32">
					<div className="flex flex-col items-center gap-4 text-center mb-16">
						<h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
							Trusted by Solo Founders
						</h2>
						<p className="max-w-2xl text-lg text-muted-foreground">
							Join hundreds of indie builders who&rsquo;ve
							simplified their workflow
						</p>
					</div>

					<div className="grid gap-8 md:grid-cols-3">
						{testimonials.map((testimonial, index) => (
							<Card key={index} className="border-border">
								<CardContent className="pt-6">
									<div className="flex flex-col gap-4">
										<div className="flex gap-1">
											{[...Array(testimonial.rating)].map(
												(_, i) => (
													<div
														key={i}
														className="h-4 w-4 rounded-full bg-foreground"
													/>
												)
											)}
										</div>
										<p className="text-sm text-muted-foreground leading-relaxed">
											{testimonial.text}
										</p>
										<div className="flex items-center gap-3 mt-2">
											<div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center text-sm font-medium">
												{testimonial.author
													.split(" ")
													.map((n) => n[0])
													.join("")}
											</div>
											<div>
												<div className="font-medium text-sm">
													{testimonial.author}
												</div>
												<div className="text-xs text-muted-foreground">
													{testimonial.role}
												</div>
											</div>
										</div>
									</div>
								</CardContent>
							</Card>
						))}
					</div>
				</section>

				{/* CTA Section */}
				<section className="border-t border-border bg-foreground text-background py-24 md:py-32">
					<div className="mx-auto w-full max-w-7xl flex flex-col items-center gap-8 text-center">
						<h2 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl max-w-3xl">
							Ready to unify your entire stack?
						</h2>
						<p className="max-w-2xl text-lg text-background/80 leading-relaxed">
							Join indie founders who&rsquo;ve eliminated
							context-switching and gained crystal-clear
							visibility into what drives their business forward.
						</p>
						<div className="flex flex-col gap-4 sm:flex-row">
							<Button
								size="lg"
								variant="secondary"
								asChild
								className="text-base h-12 px-8"
							>
								<Link
									href={
										session?.user ? "/dashboard" : "/signup"
									}
								>
									{session?.user
										? "Go to Dashboard"
										: "Start Free Trial"}
									<ArrowRight className="ml-2 h-5 w-5" />
								</Link>
							</Button>
							<Button
								size="lg"
								variant="outline"
								asChild
								className="text-base h-12 px-8 bg-transparent border-background text-background hover:bg-background hover:text-foreground"
							>
								<Link href="/demo">View Demo</Link>
							</Button>
						</div>
						{/* <p className="text-sm text-background/60">
							No credit card required • 14-day free trial • Cancel
							anytime
						</p> */}
					</div>
				</section>
			</main>

			{/* Footer */}
			<footer className="border-t border-border bg-muted/30 py-12">
				<div className="mx-auto w-full max-w-7xl">
					<div className="flex flex-col md:flex-row items-center justify-between gap-8">
						<div className="flex flex-col items-center md:items-start gap-4">
							<div className="flex items-center gap-2">
								<div className="w-6 h-6 rounded bg-primary flex items-center justify-center">
									<LayoutDashboard className="w-3 h-3 text-primary-foreground" />
								</div>
								<span className="font-bold">
									Builder&apos;s Stack
								</span>
							</div>
							<p className="text-sm text-muted-foreground text-center md:text-left">
								Your single pane of glass for SaaS success.
							</p>
						</div>

						<div className="flex items-center gap-6">
							<Link
								href="/about"
								className="text-sm text-muted-foreground hover:text-foreground transition-colors"
							>
								About
							</Link>
							<Link
								href="/privacy"
								className="text-sm text-muted-foreground hover:text-foreground transition-colors"
							>
								Privacy
							</Link>
							<Link
								href="/terms"
								className="text-sm text-muted-foreground hover:text-foreground transition-colors"
							>
								Terms
							</Link>
						</div>
					</div>

					<div className="flex items-center justify-between pt-8 mt-8 border-t border-border text-sm text-muted-foreground">
						<p>
							© {new Date().getFullYear()} Builder&apos;s Stack.
							All rights reserved.
						</p>
						<p>v1.0.0</p>
					</div>
				</div>
			</footer>
		</div>
	);
};

export default Page;
