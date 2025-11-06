import { LayoutDashboard } from "lucide-react";
import Link from "next/link";
import React from "react";

export const Footer = () => {
	return (
		<footer className="border-t border-border bg-muted/30 py-12">
			<div className="mx-auto w-full max-w-7xl">
				<div className="flex flex-col md:flex-row items-center justify-between gap-8">
					<div className="flex flex-col items-center md:items-start gap-4">
						<div className="flex items-center gap-2">
							<div className="w-6 h-6 rounded bg-primary flex items-center justify-center">
								<LayoutDashboard className="w-3 h-3 text-primary-foreground" />
							</div>
							<span className="font-bold">
								Builder&apos;s Stack
							</span>
						</div>
						<p className="text-sm text-muted-foreground text-center md:text-left">
							Your single pane of glass for SaaS success.
						</p>
					</div>

					<div className="flex items-center gap-6">
						<Link
							href="/about"
							className="text-sm text-muted-foreground hover:text-foreground transition-colors"
						>
							About
						</Link>
						<Link
							href="/privacy"
							className="text-sm text-muted-foreground hover:text-foreground transition-colors"
						>
							Privacy
						</Link>
						<Link
							href="/terms"
							className="text-sm text-muted-foreground hover:text-foreground transition-colors"
						>
							Terms
						</Link>
					</div>
				</div>

				<div className="flex items-center justify-between pt-8 mt-8 border-t border-border text-sm text-muted-foreground">
					<p>
						© {new Date().getFullYear()} Builder&apos;s Stack. All
						rights reserved.
					</p>
					<p>v1.0.0</p>
				</div>
			</div>
		</footer>
	);
};
