"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import {
	FileText,
	Users,
	Shield,
	Zap,
	CheckCircle,
	ArrowRight,
} from "lucide-react";
import { SUBSCRIPTION_PLANS } from "@/lib/utils";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";

const Page = () => {
	const { user } = authClient.useSession().data || {};
	const router = useRouter();

	const features = [
		{
			icon: <FileText className="w-6 h-6" />,
			title: "Smart Note Management",
			description:
				"Organize your team's knowledge with powerful search, tags, and collaborative editing.",
		},
		{
			icon: <Users className="w-6 h-6" />,
			title: "Multi-Tenant Architecture",
			description:
				"Secure isolation for multiple organizations with role-based access control.",
		},
		{
			icon: <Shield className="w-6 h-6" />,
			title: "Enterprise Security",
			description:
				"Advanced security features with compliance-ready data protection.",
		},
		{
			icon: <Zap className="w-6 h-6" />,
			title: "Lightning Fast",
			description:
				"Built for performance with instant search and real-time collaboration.",
		},
	];

	const handleSignOut = async () => {
		try {
			toast.loading("Signing out");
			authClient.signOut();
			toast.dismiss();
			toast.success("Signed out");
			router.push("/");
		} catch (error) {
			console.log("Error signing out: ", error);
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
						<span className="text-xl font-bold">NotesApp</span>
					</div>
					{!!user ? (
						<div className="flex items-center gap-4">
							<Button onClick={handleSignOut} variant="ghost">
								Sign Out
							</Button>
							<Link href="/dashboard">
								<Button>Dashboard</Button>
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
			<section className="py-20 px-4">
				<div className="container mx-auto text-center max-w-4xl">
					<Badge variant="secondary" className="mb-6">
						<Zap className="w-3 h-3 mr-1" />
						Multi-Tenant SaaS Platform
					</Badge>
					<h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
						The Future of Team
						<br />
						Knowledge Management
					</h1>
					<p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
						Empower your organization with secure, scalable note
						management. Built for teams that value collaboration,
						security, and performance.
					</p>
					<div className="flex flex-col sm:flex-row gap-4 justify-center">
						<Link href="/signup">
							<Button size="lg" className="gap-2">
								Start Free Trial
								<ArrowRight className="w-4 h-4" />
							</Button>
						</Link>
						<Link href="/dashboard">
							<Button variant="outline" size="lg">
								View Demo
							</Button>
						</Link>
					</div>
				</div>
			</section>

			{/* Features Section */}
			<section className="py-20 px-4 bg-muted/30">
				<div className="container mx-auto max-w-6xl">
					<div className="text-center mb-16">
						<h2 className="text-3xl md:text-4xl font-bold mb-4">
							Everything your team needs
						</h2>
						<p className="text-xl text-muted-foreground max-w-2xl mx-auto">
							Powerful features designed to streamline your
							workflow and boost productivity
						</p>
					</div>
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
						{features.map((feature, index) => (
							<Card
								key={index}
								className="text-center hover:shadow-md transition-shadow"
							>
								<CardContent className="p-6">
									<div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4 text-primary">
										{feature.icon}
									</div>
									<h3 className="font-semibold mb-2">
										{feature.title}
									</h3>
									<p className="text-sm text-muted-foreground">
										{feature.description}
									</p>
								</CardContent>
							</Card>
						))}
					</div>
				</div>
			</section>

			{/* Pricing Section */}
			<section className="py-20 px-4">
				<div className="container mx-auto max-w-6xl">
					<div className="text-center mb-16">
						<h2 className="text-3xl md:text-4xl font-bold mb-4">
							Simple, transparent pricing
						</h2>
						<p className="text-xl text-muted-foreground max-w-2xl mx-auto">
							Choose the perfect plan for your team. Scale as you
							grow.
						</p>
					</div>
					<div className="grid grid-cols-1 md:grid-cols-2 gap-3 mx-auto max-w-3xl justify-items-center items-center">
						{SUBSCRIPTION_PLANS.map((plan, index) => (
							<Card
								key={index}
								className={`relative hover:shadow-lg transition-shadow ${
									plan.popular ? "ring-2 ring-primary" : ""
								}`}
							>
								{plan.popular && (
									<Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2">
										Most Popular
									</Badge>
								)}
								<CardContent className="p-8 text-center">
									<div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4 text-primary">
										<plan.icon className="w-5 h-5" />
									</div>
									<h3 className="text-2xl font-bold mb-2">
										{plan.name}
									</h3>
									<div className="mb-4">
										<span className="text-4xl font-bold">
											{plan.price}
										</span>
										<span className="text-muted-foreground">
											{plan.period}
										</span>
									</div>
									<p className="text-muted-foreground mb-6">
										{plan.description}
									</p>
									<ul className="space-y-3 mb-8">
										{plan.features.map(
											(feature, featureIndex) => (
												<li
													key={featureIndex}
													className="flex items-center gap-2 text-sm"
												>
													<CheckCircle className="w-4 h-4 text-success flex-shrink-0" />
													{feature}
												</li>
											)
										)}
									</ul>
									<Link href="/signup">
										<Button
											className="w-full"
											variant={
												plan.popular
													? "default"
													: "outline"
											}
										>
											{plan.name === "Enterprise"
												? "Contact Sales"
												: "Get Started"}
										</Button>
									</Link>
								</CardContent>
							</Card>
						))}
					</div>
				</div>
			</section>

			{/* CTA Section */}
			<section className="py-20 px-4 bg-muted/30">
				<div className="container mx-auto text-center max-w-4xl">
					<h2 className="text-3xl md:text-4xl font-bold mb-6">
						Ready to transform your team&apos;s productivity?
					</h2>
					<p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
						Join thousands of teams already using NotesApp to
						streamline their knowledge management.
					</p>
					<Link href="/signup">
						<Button size="lg" className="gap-2">
							Start Your Free Trial
							<ArrowRight className="w-4 h-4" />
						</Button>
					</Link>
				</div>
			</section>

			{/* Footer */}
			<footer className="border-t border-border py-12 px-4">
				<div className="container mx-auto text-center">
					<div className="flex items-center justify-center gap-2 mb-4">
						<div className="w-6 h-6 rounded bg-primary flex items-center justify-center">
							<FileText className="w-3 h-3 text-primary-foreground" />
						</div>
						<span className="font-semibold">NotesApp</span>
					</div>
					<p className="text-sm text-muted-foreground">
						© 2024 NotesApp. Built with modern technologies for the
						future of work.
					</p>
				</div>
			</footer>
		</div>
	);
};

export default Page;
