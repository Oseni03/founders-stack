import React from "react";
import {
	CheckCircle,
	MessageSquare,
	FileText,
	BarChart,
	UserCheck,
	PenTool,
	Code,
	Headphones,
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
			icon: CheckCircle,
			title: "Roadmapping & Tasks",
			description: "Track Jira tasks, sprints, and roadmaps in real-time",
			features: [
				"Assigned tasks & deadlines",
				"Sprint burndown charts",
				"Roadmap timelines",
			],
		},
		{
			icon: MessageSquare,
			title: "Team Communication",
			description: "Aggregate Slack messages, mentions, and action items",
			features: [
				"Unified inbox & mentions",
				"Quick reply actions",
				"Thread summaries",
			],
		},
		{
			icon: FileText,
			title: "Documentation",
			description:
				"Access Notion docs, PRDs, and meeting notes instantly",
			features: [
				"Recent & shared docs",
				"Comment tracking",
				"Template creation",
			],
		},
		{
			icon: BarChart,
			title: "Product Analytics",
			description: "Monitor Mixpanel metrics, funnels, and anomalies",
			features: [
				"DAU/MAU & retention",
				"Anomaly alerts",
				"Funnel performance",
			],
		},
		{
			icon: UserCheck,
			title: "User Feedback",
			description: "Prioritize Intercom feedback and feature requests",
			features: [
				"Feedback inbox",
				"Sentiment trends",
				"Vote-based prioritization",
			],
		},
		{
			icon: PenTool,
			title: "Design Collaboration",
			description: "Review Figma designs, prototypes, and handoff specs",
			features: [
				"Design previews",
				"Comment & approval flows",
				"Version tracking",
			],
		},
		{
			icon: Code,
			title: "Development Pipeline",
			description: "Track GitHub PRs, commits, and build status",
			features: [
				"PR & issue tracking",
				"Build success alerts",
				"Release timelines",
			],
		},
		{
			icon: Headphones,
			title: "Customer Support",
			description: "Monitor Zendesk tickets, SLAs, and issue trends",
			features: [
				"High-priority tickets",
				"SLA breach alerts",
				"Issue categorization",
			],
		},
	];

	return (
		<section className="mx-auto w-full max-w-5xl py-24 md:py-32">
			<div className="flex flex-col items-center gap-4 text-center mb-16 animate-fade-in">
				<h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
					Your PM Workflow, Unified
				</h2>
				<p className="max-w-2xl text-lg text-muted-foreground">
					Eight essential modules to manage your entire product
					lifecycle in one place
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
