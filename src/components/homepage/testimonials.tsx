import React from "react";
import { Card, CardContent } from "@/components/ui/card";

export const Testimonials = () => {
	const testimonials = [
		{
			rating: 5,
			text: "ProductStack cut my tool-switching time in half. Now I see Jira tasks, Slack updates, and Mixpanel metrics in one view, saving me hours every week.",
			author: "Emma Lee",
			role: "Product Manager, TechTrend",
		},
		{
			rating: 5,
			text: "The cross-tool insights are a game-changer. I linked a Zendesk ticket spike to a Mixpanel drop and fixed a critical bug before it escalated.",
			author: "James Patel",
			role: "Senior PM, DataFlow",
		},
		{
			rating: 5,
			text: "As a PM, I need to stay on top of feedback and designs. ProductStack’s unified dashboard lets me prioritize Intercom requests and review Figma files instantly.",
			author: "Sophie Nguyen",
			role: "Product Lead, InnovateX",
		},
	];

	return (
		<section className="mx-auto w-full max-w-7xl py-24 md:py-32">
			<div className="flex flex-col items-center gap-4 text-center mb-16">
				<h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
					Trusted by Product Managers
				</h2>
				<p className="max-w-2xl text-lg text-muted-foreground">
					Join PMs who’ve streamlined their workflows with
					ProductStack
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
	);
};
