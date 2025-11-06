"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
	FileText,
	Users,
	Shield,
	Zap,
	CheckCircle,
	ArrowRight,
} from "lucide-react";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";
import {
	Carousel,
	CarouselContent,
	CarouselItem,
	CarouselNext,
	CarouselPrevious,
} from "@/components/ui/carousel";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import Hero from "@/components/hero";
import { BentoCard, BentoGrid } from "@/components/ui/bento-grid";
import { TestimonialsSection } from "@/components/testimonials-with-marquee";

const Page = () => {
	const { data: session } = authClient.useSession();
	const router = useRouter();

	const features = [
		{
			icon: FileText,
			name: "Unified Command Center",
			description:
				"Aggregate data and actions from your entire SaaS stack into a single pane of glass.",
			href: "/dashboard",
			cta: "Explore Dashboard",
			background: (
				<div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-primary/5 opacity-50" />
			),
		},
		{
			icon: Users,
			name: "Cross-tool Metrics",
			description:
				"Correlate revenue, velocity, and product signals to make faster decisions.",
			href: "/dashboard",
			cta: "View Metrics",
			background: (
				<div className="absolute inset-0 bg-gradient-to-tl from-secondary/10 to-secondary/5 opacity-50" />
			),
		},
		{
			icon: Shield,
			name: "Extensible Integrations",
			description:
				"Connect popular services quickly and add new integrations with our framework.",
			href: "/dashboard/integrations",
			cta: "See Integrations",
			background: (
				<div className="absolute inset-0 bg-gradient-to-br from-accent/10 to-accent/5 opacity-50" />
			),
		},
		{
			icon: Zap,
			name: "Alerts & Automations",
			description:
				"Get notified on anomalies and automate routine cross-tool tasks to save time.",
			href: "#",
			cta: "Setup Alerts",
			background: (
				<div className="absolute inset-0 bg-gradient-to-tl from-warning/10 to-warning/5 opacity-50" />
			),
		},
		{
			icon: CheckCircle,
			name: "Read-first MVP",
			description:
				"Launch with aggregated visibility first; enable CRUD and actions in later phases.",
			href: "#",
			cta: "Learn More",
			background: (
				<div className="absolute inset-0 bg-gradient-to-br from-success/10 to-success/5 opacity-50" />
			),
		},
	];

	const testimonials = [
		{
			author: {
				name: "Alex, Indie Founder",
				role: "Founder of SaaSify",
				avatar: "AS",
				handle: "@indie",
			},
			text: "Builder's Stack saved me hours of context-switching. I see my tasks, revenue, and errors in one place!",
			href: "/case-studies/saasify",
		},
		{
			author: {
				name: "Jordan, Growth Hacker",
				role: "Growth Lead at Metrics.io",
				avatar: "JD",
				handle: "@jordan",
			},
			text: "The MRR-churn correlation metrics helped me spot trends I was missing. Setup took 3 minutes!",
			href: "/case-studies/metrics-io",
		},
		{
			author: {
				name: "Sam, Team Lead",
				role: "CTO at CollabHub",
				avatar: "SM",
				handle: "@sam",
			},
			text: "Managing my team and integrations in one dashboard is a game-changer for our small startup.",
			href: "/case-studies/collabhub",
		},
	];

	const integrations = [
		{
			name: "GitHub",
			logo: "/logos/github.svg",
			description: "Track commits, PRs, and issues.",
		},
		{
			name: "Jira",
			logo: "/logos/jira.svg",
			description: "Monitor sprints and tickets.",
		},
		{
			name: "Slack",
			logo: "/logos/slack.svg",
			description: "Get real-time team updates.",
		},
		{
			name: "Stripe",
			logo: "/logos/stripe.svg",
			description: "View revenue and subscriptions.",
		},
		// {
		// 	name: "Amplitude",
		// 	logo: "/logos/amplitude.svg",
		// 	description: "Analyze user behavior.",
		// },
		{
			name: "Zendesk",
			logo: "/logos/zendesk.svg",
			description: "Manage support tickets.",
		},
		{
			name: "Linear",
			logo: "/logos/linear.svg",
			description: "Streamline project tasks.",
		},
		{
			name: "Sentry",
			logo: "/logos/sentry.svg",
			description: "Monitor app errors.",
		},
		// {
		// 	name: "PostHog",
		// 	logo: "/logos/posthog.svg",
		// 	description: "Capture events and user analytics.",
		// },
		{
			name: "Asana",
			logo: "/logos/asana.svg",
			description: "Sync tasks and projects.",
		},
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
		<div className="min-h-screen bg-background">
			{/* Header */}
			<header className="border-b border-border">
				<div className="container mx-auto px-4 h-16 flex items-center justify-between">
					<div className="flex items-center gap-2">
						<div className="w-8 h-8 rounded-lg bg-gradient-to-r from-primary to-primary/80 flex items-center justify-center">
							<FileText className="w-4 h-4 text-primary-foreground" />
						</div>
						<span className="text-xl font-bold">
							Builder&apos;s Stack
						</span>
					</div>
					{session?.user ? (
						<div className="flex items-center gap-4">
							<Button onClick={handleSignOut} variant="ghost">
								Sign Out
							</Button>
							<Link href="/dashboard">
								<Button>Go to Dashboard</Button>
							</Link>
						</div>
					) : (
						<div className="flex items-center gap-4">
							<Link href="/login">
								<Button variant="ghost">Sign In</Button>
							</Link>
							<Link href="/signup">
								<Button>Get Started</Button>
							</Link>
						</div>
					)}
				</div>
			</header>

			{/* Hero Section */}
			<Hero />

			{/* Features Section */}
			<section className="py-20 px-4 bg-muted/30">
				<div className="container mx-auto max-w-6xl">
					<div className="text-center mb-12">
						<h2 className="text-3xl md:text-4xl font-bold mb-4 animate-fade-in">
							A Horizontal View Across Your Stack
						</h2>
						<p className="text-lg text-muted-foreground max-w-2xl mx-auto animate-fade-in">
							Start with read-only visibility, then unlock
							cross-tool insights and actions to streamline your
							workflow.
						</p>
					</div>
					<BentoGrid className="max-w-6xl mx-auto">
						{features.map((feature, index) => (
							<BentoCard
								key={feature.name}
								name={feature.name}
								className={index === 0 ? "md:col-span-2" : ""}
								background={feature.background}
								Icon={feature.icon}
								description={feature.description}
								href={session?.user ? feature.href : "/signup"}
								cta={feature.cta}
							/>
						))}
					</BentoGrid>
				</div>
			</section>

			{/* Integrations Section */}
			<section className="py-16 px-4">
				<div className="container mx-auto max-w-6xl">
					<div className="text-center mb-12">
						<h2 className="text-2xl md:text-3xl font-bold mb-2 animate-fade-in">
							Connect Your Entire Stack
						</h2>
						<p className="text-muted-foreground max-w-2xl mx-auto animate-fade-in">
							Seamlessly integrate with 20+ tools at launch, with
							an extensible framework for more.
						</p>
					</div>
					<TooltipProvider>
						<Carousel className="w-full max-w-4xl mx-auto">
							<CarouselContent>
								{integrations.map((integration, index) => (
									<CarouselItem
										key={index}
										className="md:basis-1/3 lg:basis-1/4"
									>
										<Tooltip>
											<TooltipTrigger asChild>
												<Card className="border-none shadow-sm hover:scale-105 transition-transform duration-200">
													<CardContent className="p-4 flex flex-col items-center">
														{/* Placeholder for logo; replace with actual SVG/image */}
														<div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-2">
															<span className="text-sm font-medium">
																{
																	integration.name
																}
															</span>
														</div>
														<p className="text-sm font-semibold">
															{integration.name}
														</p>
													</CardContent>
												</Card>
											</TooltipTrigger>
											<TooltipContent>
												<p>{integration.description}</p>
											</TooltipContent>
										</Tooltip>
									</CarouselItem>
								))}
							</CarouselContent>
							<CarouselPrevious />
							<CarouselNext />
						</Carousel>
					</TooltipProvider>
					<div className="text-center mt-8 animate-fade-in">
						<Link href="/integrations">
							<Button variant="link">See All Integrations</Button>
						</Link>
					</div>
				</div>
			</section>

			{/* Testimonials Section */}
			<TestimonialsSection
				title="Trusted by Indie Founders"
				description="Hear from founders who’ve streamlined their workflows with Builder’s Stack."
				testimonials={testimonials}
				className="bg-muted/30"
			/>

			{/* Get Started Section */}
			<section className="py-16 px-4">
				<div className="container mx-auto max-w-4xl text-center">
					<h2 className="text-2xl md:text-3xl font-bold mb-4 animate-fade-in">
						Start for Free Today
					</h2>
					<p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto animate-fade-in">
						Use Builder’s Stack for free with core integrations and
						visibility. Premium features and pricing are coming soon
						to unlock advanced metrics and automations.
					</p>
					<div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in">
						{session?.user ? (
							<Link href="/dashboard">
								<Button size="lg" className="gap-2">
									Go to Your Dashboard
									<ArrowRight className="w-4 h-4" />
								</Button>
							</Link>
						) : (
							<Link href="/signup">
								<Button size="lg" className="gap-2">
									Start Free Now
									<ArrowRight className="w-4 h-4" />
								</Button>
							</Link>
						)}
						<Link href="/demo">
							<Button variant="outline" size="lg">
								Try Interactive Demo
							</Button>
						</Link>
					</div>
				</div>
			</section>

			{/* CTA Section */}
			<section className="py-20 px-4 bg-gradient-to-r from-primary/10 to-primary/5">
				<div className="container mx-auto text-center max-w-4xl">
					<h2 className="text-3xl md:text-4xl font-bold mb-6 animate-fade-in">
						Ready to Unify Your Stack?
					</h2>
					<p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto animate-fade-in">
						Get started in under 5 minutes and see your
						tools—GitHub, Jira, Stripe, and more—in one place.
					</p>
					<div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in">
						{session?.user ? (
							<Link href="/dashboard">
								<Button size="lg" className="gap-2">
									Go to Your Dashboard
									<ArrowRight className="w-4 h-4" />
								</Button>
							</Link>
						) : (
							<Link href="/signup">
								<Button size="lg" className="gap-2">
									Start Free Now
									<ArrowRight className="w-4 h-4" />
								</Button>
							</Link>
						)}
						<Link href="/demo">
							<Button variant="outline" size="lg">
								Try Interactive Demo
							</Button>
						</Link>
					</div>
				</div>
			</section>

			{/* Footer */}
			<footer className="border-t border-border py-12 px-4">
				<div className="container mx-auto max-w-6xl">
					<div className="grid grid-cols-1 md:grid-cols-3 gap-8">
						<div>
							<div className="flex items-center gap-2 mb-4">
								<div className="w-6 h-6 rounded bg-primary flex items-center justify-center">
									<FileText className="w-3 h-3 text-primary-foreground" />
								</div>
								<span className="font-semibold">
									Builder&apos;s Stack
								</span>
							</div>
							<p className="text-sm text-muted-foreground">
								Built for indie founders and small teams to
								streamline their SaaS stack.
							</p>
						</div>
						<div>
							<h3 className="font-semibold mb-4">Links</h3>
							<ul className="space-y-2 text-sm text-muted-foreground">
								<li>
									<Link href="/integrations">
										Integrations
									</Link>
								</li>
								<li>
									<Link href="/demo">Demo</Link>
								</li>
								<li>
									<Link href="/support">Support</Link>
								</li>
							</ul>
						</div>
						<div>
							<h3 className="font-semibold mb-4">Contact</h3>
							<ul className="space-y-2 text-sm text-muted-foreground">
								<li>
									<a href="mailto:support@buildersstack.com">
										support@buildersstack.com
									</a>
								</li>
								<li>
									<Link href="/terms">Terms of Service</Link>
								</li>
								<li>
									<Link href="/privacy">Privacy Policy</Link>
								</li>
							</ul>
						</div>
					</div>
					<p className="text-center text-sm text-muted-foreground mt-8">
						© {new Date().getFullYear()} Builder&apos;s Stack. All
						rights reserved.
					</p>
				</div>
			</footer>
		</div>
	);
};

export default Page;
