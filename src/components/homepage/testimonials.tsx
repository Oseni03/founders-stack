import React from "react";
import { Card, CardContent } from "@/components/ui/card";

export const Testimonials = () => {
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

	return (
		<section className="mx-auto w-full max-w-7xl py-24 md:py-32">
			<div className="flex flex-col items-center gap-4 text-center mb-16">
				<h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
					Trusted by Solo Founders
				</h2>
				<p className="max-w-2xl text-lg text-muted-foreground">
					Join hundreds of indie builders who&rsquo;ve simplified
					their workflow
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
