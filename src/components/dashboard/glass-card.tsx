import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface GlassCardProps {
	children: ReactNode;
	className?: string;
	title?: string;
	action?: ReactNode;
	delay?: number;
}

export function GlassCard({
	children,
	className,
	title,
	action,
	delay = 0,
}: GlassCardProps) {
	return (
		<motion.div
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.5, delay, ease: "easeOut" }}
			className={cn(
				"glass-card rounded-2xl p-6 flex flex-col relative overflow-hidden group",
				className
			)}
		>
			<div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

			{(title || action) && (
				<div className="flex items-center justify-between mb-6 relative z-10">
					{title && (
						<h3 className="font-display font-semibold text-lg text-white tracking-tight">
							{title}
						</h3>
					)}
					{action && <div>{action}</div>}
				</div>
			)}

			<div className="relative z-10 flex-1">{children}</div>
		</motion.div>
	);
}
