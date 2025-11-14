import { Zap } from "lucide-react";
import React from "react";

export const FeatureShowcase = () => {
	const featureShowcase = [
		{
			badge: "Real-Time Sync",
			title: "Seamless Tool Integration",
			description:
				"Connect Jira, Slack, Notion, and more via OAuth for automatic data syncing. Webhooks and polling ensure your dashboard reflects the latest tasks, metrics, and feedback in seconds, without manual updates.",
			features: [
				{
					title: "One-Click OAuth",
					description: "Securely connect tools in seconds",
				},
				{
					title: "Real-Time Webhooks",
					description: "Instant updates for supported tools",
				},
				{
					title: "Smart Polling",
					description: "Frequent syncs for Notion and Mixpanel",
				},
			],
			image: "/assets/feature-sync.png",
			imageAlt: "Real-time data sync across PM tools",
			imageOrder: "right",
		},
		{
			badge: "Cross-Tool Insights",
			title: "Uncover Hidden Connections",
			description:
				"Our analytics engine correlates data across tools to reveal insights, like how Zendesk ticket spikes relate to Mixpanel usage drops or how Jira tasks align with Figma designs, helping you make data-driven decisions.",
			features: [
				{
					title: "Data Correlation",
					description: "Link tasks, metrics, and feedback",
				},
				{
					title: "Anomaly Detection",
					description: "Spot issues before they escalate",
				},
				{
					title: "Actionable Insights",
					description: "Prioritize based on real data",
				},
			],
			image: "/assets/feature-insights.png",
			imageAlt: "Cross-tool analytics for PMs",
			imageOrder: "left",
		},
		{
			badge: "Customizable Views",
			title: "Your Workflow, Your Way",
			description:
				"Create tailored dashboard views for daily standups, sprint planning, or product health checks. Drag-and-drop widgets to focus on what matters, from Jira tasks to Intercom feedback trends.",
			features: [
				{
					title: "Drag-and-Drop Layouts",
					description: "Customize your dashboard easily",
				},
				{
					title: "Pre-Built Templates",
					description: "Start with PM-focused views",
				},
				{
					title: "Saved Filters",
					description: "Quick access to key data",
				},
			],
			image: "/assets/feature-custom-views.png",
			imageAlt: "Customizable PM dashboard views",
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
