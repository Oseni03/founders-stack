import React from "react";
import { Button } from "../ui/button";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export const Hero = ({
	isAuthenticated = false,
}: {
	isAuthenticated: boolean;
}) => {
	return (
		<section className="mx-auto w-full max-w-7xl flex flex-col items-center justify-center gap-12 py-24 text-center md:py-32">
			<div className="flex max-w-4xl flex-col items-center gap-8 animate-fade-in">
				<div className="inline-block rounded-full border border-border bg-muted px-4 py-1.5 text-sm animate-scale-in">
					Single Pane of Glass for Indie and Startup Founders
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
					PostHog..., into one powerful command center. Stop
					context-switching. Start building.
				</p>

				<div className="flex flex-col gap-4 sm:flex-row">
					<Button size="lg" asChild className="text-base h-12 px-8">
						<Link href={isAuthenticated ? "/products/" : "/signup"}>
							{isAuthenticated
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
					<div className="relative w-full aspect-video bg-muted rounded-md overflow-hidden">
						<Image
							src="/homepage/hero-image-dark.png"
							alt="Dashboard Preview"
							className="w-full h-full object-cover block dark:hidden"
						/>
						<Image
							src="/homepage/hero-image-light.png"
							alt="Dashboard Preview"
							className="w-full h-full object-cover hidden dark:block"
						/>
					</div>
				</div>
			</div>
		</section>
	);
};
