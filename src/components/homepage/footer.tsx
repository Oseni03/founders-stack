import { Logo } from "@/components/ui/logo";
import Link from "next/link";
import React from "react";

export const Footer = () => {
	return (
		<footer className="py-12 px-6 border-t border-white/10 bg-black">
			<div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
				<div className="flex items-center gap-2 font-display font-bold text-lg text-white">
					<Logo className="w-3 h-3 text-primary-foreground" />; Apex
				</div>
				<div className="text-sm text-muted-foreground">
					© 2025 Apex Inc. All rights reserved.
				</div>
				<div className="flex gap-6 text-sm text-muted-foreground">
					<Link
						href="#"
						className="hover:text-white transition-colors"
					>
						Privacy
					</Link>
					<Link
						href="#"
						className="hover:text-white transition-colors"
					>
						Terms
					</Link>
					<Link
						href="#"
						className="hover:text-white transition-colors"
					>
						Twitter
					</Link>
				</div>
			</div>
		</footer>
	);
};
