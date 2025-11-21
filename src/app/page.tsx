"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/ui/logo";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";
import { motion } from "framer-motion";
import {
	ArrowRight,
	CheckCircle2,
	Terminal,
	Zap,
	BarChart3,
} from "lucide-react";
import Image from "next/image";

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
		<div className="min-h-screen bg-black text-foreground selection:bg-primary/30 overflow-x-hidden">
			{/* Navigation */}
			<nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 bg-black/50 backdrop-blur-xl">
				<div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
					<div className="flex items-center gap-2 font-display font-bold text-xl tracking-tight">
						<div className="w-8 h-8 rounded-lg bg-primary/20 border border-primary/50 flex items-center justify-center text-primary">
							A
						</div>
						<span className="text-white">Apex</span>
					</div>

					<div className="flex items-center gap-6">
						<Link href="/dashboard">
							<button className="text-sm font-medium text-muted-foreground hover:text-white transition-colors">
								Log In
							</button>
						</Link>
						<Link href="/dashboard">
							<button className="bg-white text-black px-4 py-2 rounded-lg text-sm font-bold hover:bg-gray-200 transition-colors">
								Get Started
							</button>
						</Link>
					</div>
				</div>
			</nav>

			{/* Hero Section */}
			<section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 px-6 overflow-hidden">
				{/* Background Gradients */}
				<div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-primary/20 blur-[120px] rounded-full opacity-50 pointer-events-none" />
				<div className="absolute bottom-0 right-0 w-[800px] h-[600px] bg-blue-500/10 blur-[100px] rounded-full opacity-30 pointer-events-none" />

				<div className="max-w-4xl mx-auto text-center relative z-10">
					<motion.div
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.5 }}
					>
						<div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-medium text-primary mb-6">
							<span className="relative flex h-2 w-2">
								<span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
								<span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
							</span>
							v2.1 Now Available
						</div>

						<h1 className="text-5xl lg:text-7xl font-display font-bold text-white tracking-tight mb-6 leading-[1.1]">
							The AI Product Director that <br />
							<span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-400">
								runs your operations
							</span>
						</h1>

						<p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
							Apex replaces the 20 hours/week you spend on
							coordination. It connects Linear, GitHub, and
							Intercom to diagnose why you&rsquo;re slow and what
							to build next.
						</p>

						<div className="flex flex-col sm:flex-row items-center justify-center gap-4">
							<Link href="/dashboard">
								<button className="w-full sm:w-auto h-12 px-8 rounded-xl bg-primary text-white font-bold hover:bg-primary/90 transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/25">
									Start Free Trial <ArrowRight size={18} />
								</button>
							</Link>
							<button className="w-full sm:w-auto h-12 px-8 rounded-xl bg-white/5 text-white font-medium border border-white/10 hover:bg-white/10 transition-all">
								View Demo
							</button>
						</div>

						<div className="mt-8 flex items-center justify-center gap-6 text-sm text-muted-foreground">
							<div className="flex items-center gap-2">
								<CheckCircle2
									size={16}
									className="text-green-500"
								/>
								<span>Works with Linear</span>
							</div>
							<div className="flex items-center gap-2">
								<CheckCircle2
									size={16}
									className="text-green-500"
								/>
								<span>SOC2 Compliant</span>
							</div>
							<div className="flex items-center gap-2">
								<CheckCircle2
									size={16}
									className="text-green-500"
								/>
								<span>Setup in 2 mins</span>
							</div>
						</div>
					</motion.div>
				</div>
			</section>

			{/* Dashboard Preview */}
			<section className="px-6 pb-32">
				<motion.div
					initial={{ opacity: 0, y: 40 }}
					whileInView={{ opacity: 1, y: 0 }}
					viewport={{ once: true, margin: "-100px" }}
					transition={{ duration: 0.7 }}
					className="max-w-6xl mx-auto relative"
				>
					<div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent z-10 pointer-events-none" />
					<div className="rounded-2xl border border-white/10 bg-black/40 backdrop-blur-xl shadow-2xl overflow-hidden">
						<div className="h-10 bg-white/5 border-b border-white/10 flex items-center px-4 gap-2">
							<div className="flex gap-1.5">
								<div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/50" />
								<div className="w-3 h-3 rounded-full bg-yellow-500/20 border border-yellow-500/50" />
								<div className="w-3 h-3 rounded-full bg-green-500/20 border border-green-500/50" />
							</div>
						</div>
						<Image
							src="https://framerusercontent.com/images/k3G3tXU5y2lG4k2g3sR4q4t2w.png"
							alt="Apex Dashboard"
							className="w-full opacity-80 hover:opacity-100 transition-opacity duration-700"
						/>
						{/* Using a placeholder since I can't take a real screenshot easily, or I could render a mini version of the dashboard component here if I wanted to be fancy */}
						<div className="absolute inset-0 flex items-center justify-center">
							<div className="bg-black/80 backdrop-blur-md border border-white/10 p-8 rounded-2xl text-center max-w-md">
								<h3 className="text-2xl font-display font-bold text-white mb-2">
									Interactive Dashboard
								</h3>
								<p className="text-muted-foreground mb-6">
									Experience the full power of Apex with our
									interactive demo environment.
								</p>
								<Link href="/dashboard">
									<button className="px-6 py-3 bg-primary hover:bg-primary/90 text-white rounded-xl font-bold transition-colors w-full">
										Enter Live Demo
									</button>
								</Link>
							</div>
						</div>
					</div>
				</motion.div>
			</section>

			{/* Features Grid */}
			<section className="py-24 px-6 bg-white/5 border-y border-white/5">
				<div className="max-w-7xl mx-auto">
					<div className="text-center mb-16">
						<h2 className="text-3xl lg:text-4xl font-display font-bold text-white mb-4">
							Everything you need to run Product
						</h2>
						<p className="text-lg text-muted-foreground max-w-2xl mx-auto">
							Replace your disjointed spreadsheets and Notion docs
							with a single source of truth that actually connects
							to your engineering work.
						</p>
					</div>

					<div className="grid grid-cols-1 md:grid-cols-3 gap-8">
						<FeatureCard
							icon={<Zap className="text-yellow-400" />}
							title="Sprint Health Diagnosis"
							description="Instantly answer 'why are we slow?' with automated blocker detection across GitHub and Linear."
						/>
						<FeatureCard
							icon={<BarChart3 className="text-primary" />}
							title="Revenue-Based Prioritization"
							description="Stop guessing. See exactly how much MRR is at risk for every bug and feature request."
						/>
						<FeatureCard
							icon={<Terminal className="text-green-400" />}
							title="Automated Changelogs"
							description="Generate customer-facing updates based on what actually shipped, not what you planned."
						/>
					</div>
				</div>
			</section>

			{/* Pricing */}
			<section className="py-24 px-6">
				<div className="max-w-5xl mx-auto">
					<div className="bg-gradient-to-b from-white/5 to-transparent border border-white/10 rounded-3xl p-8 lg:p-12 overflow-hidden relative">
						<div className="absolute top-0 right-0 p-4">
							<div className="bg-primary text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
								Founding 100
							</div>
						</div>

						<div className="grid lg:grid-cols-2 gap-12 items-center">
							<div>
								<h2 className="text-3xl font-display font-bold text-white mb-4">
									Join the Founding 100
								</h2>
								<p className="text-muted-foreground mb-8">
									Lock in early-bird pricing forever. Get
									white-glove onboarding from our founders and
									influence the roadmap directly.
								</p>

								<div className="space-y-4 mb-8">
									<CheckItem text="Unlimited seats & products" />
									<CheckItem text="Priority support via Slack" />
									<CheckItem text="Early access to new features" />
									<CheckItem text="Cancel anytime" />
								</div>

								<Link href="/dashboard">
									<button className="w-full lg:w-auto px-8 py-4 bg-white text-black font-bold rounded-xl hover:bg-gray-200 transition-colors flex items-center justify-center gap-2">
										Get Started for $299/mo{" "}
										<ArrowRight size={18} />
									</button>
								</Link>
							</div>

							<div className="bg-black/40 rounded-2xl p-8 border border-white/10 relative">
								<div className="text-center">
									<div className="text-sm text-muted-foreground mb-2">
										Standard Price
									</div>
									<div className="text-2xl font-bold text-white line-through decoration-red-500 decoration-2 opacity-50">
										$799/mo
									</div>
									<div className="text-sm text-muted-foreground mt-6 mb-2">
										Founding 100 Price
									</div>
									<div className="text-6xl font-display font-bold text-white mb-2">
										$299
										<span className="text-2xl text-muted-foreground">
											/mo
										</span>
									</div>
									<div className="text-green-400 text-sm font-medium bg-green-500/10 inline-block px-3 py-1 rounded-full">
										Billed annually ($3,588)
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</section>

			<footer className="py-12 px-6 border-t border-white/10 bg-black">
				<div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
					<div className="flex items-center gap-2 font-display font-bold text-lg text-white">
						<div className="w-6 h-6 rounded bg-primary/20 border border-primary/50 flex items-center justify-center text-primary text-xs">
							A
						</div>
						Apex
					</div>
					<div className="text-sm text-muted-foreground">
						© 2025 Apex Inc. All rights reserved.
					</div>
					<div className="flex gap-6 text-sm text-muted-foreground">
						<a
							href="#"
							className="hover:text-white transition-colors"
						>
							Privacy
						</a>
						<a
							href="#"
							className="hover:text-white transition-colors"
						>
							Terms
						</a>
						<a
							href="#"
							className="hover:text-white transition-colors"
						>
							Twitter
						</a>
					</div>
				</div>
			</footer>
		</div>
	);
};

function FeatureCard({
	icon,
	title,
	description,
}: {
	icon: React.ReactNode;
	title: string;
	description: string;
}) {
	return (
		<div className="p-6 rounded-2xl bg-black/40 border border-white/10 hover:border-primary/30 transition-colors group">
			<div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
				{icon}
			</div>
			<h3 className="text-xl font-bold text-white mb-2">{title}</h3>
			<p className="text-muted-foreground leading-relaxed">
				{description}
			</p>
		</div>
	);
}

function CheckItem({ text }: { text: string }) {
	return (
		<div className="flex items-center gap-3 text-gray-300">
			<div className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center shrink-0">
				<CheckCircle2 size={12} className="text-green-500" />
			</div>
			<span>{text}</span>
		</div>
	);
}

export default Page;
