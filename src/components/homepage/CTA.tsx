import React from "react";
import { Button } from "../ui/button";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export const CTA = ({ isAuthenticated }: { isAuthenticated: boolean }) => {
	return (
		<section className="border-t border-border bg-foreground text-background py-24 md:py-32">
			<div className="mx-auto w-full max-w-7xl flex flex-col items-center gap-8 text-center">
				<h2 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl max-w-3xl">
					Ready to unify your entire stack?
				</h2>
				<p className="max-w-2xl text-lg text-background/80 leading-relaxed">
					Join indie founders who&rsquo;ve eliminated
					context-switching and gained crystal-clear visibility into
					what drives their business forward.
				</p>
				<div className="flex flex-col gap-4 sm:flex-row">
					<Button
						size="lg"
						variant="secondary"
						asChild
						className="text-base h-12 px-8"
					>
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
						className="text-base h-12 px-8 bg-transparent border-background text-background hover:bg-background hover:text-foreground"
					>
						<Link href="/demo">View Demo</Link>
					</Button>
				</div>
				{/* <p className="text-sm text-background/60">
                    No credit card required • 14-day free trial • Cancel
                    anytime
                </p> */}
			</div>
		</section>
	);
};
