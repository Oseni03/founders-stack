import React from "react";
import {
	Shield,
	Database,
	TrendingUp,
	LineChart,
	Code,
	MessageSquare,
} from "lucide-react";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";

export const FeatureGrid = () => {
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

	return (
		<section className="mx-auto w-full max-w-5xl py-24 md:py-32">
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
								{feature.features.map((item, itemIndex) => (
									<li
										key={itemIndex}
										className="flex items-center gap-2"
									>
										<div className="h-1.5 w-1.5 rounded-full bg-foreground" />
										{item}
									</li>
								))}
							</ul>
						</CardContent>
					</Card>
				))}
			</div>
		</section>
	);
};
