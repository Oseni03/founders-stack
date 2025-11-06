import { Zap } from "lucide-react";
import React from "react";

export const FeatureShowcase = () => {
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

	return (
		<section className="mx-auto w-full max-w-5xl py-24 md:py-32">
			<div className="mx-auto w-full max-w-5xl">
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
									{feature.features.map((item, itemIndex) => (
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
													{item.description}
												</div>
											</div>
										</li>
									))}
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
	);
};
