"use client";

import { useProductStore } from "@/zustand/providers/product-store-provider";
import { motion } from "framer-motion";
import { CheckCircle2, GitPullRequest } from "lucide-react";

export function ShippedFeatures() {
	const shipped = useProductStore((state) => state.shipped);

	return (
		<div className="overflow-x-auto pb-2 -mx-6 px-6 scrollbar-hide w-full">
			<div className="flex gap-6 min-w-full">
				{shipped.map((item, i) => (
					<motion.div
						key={item.title}
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ delay: i * 0.1 }}
						className="flex-1 min-w-[280px] bg-black/40 border border-white/10 rounded-xl overflow-hidden group hover:border-white/20 transition-colors flex flex-col"
					>
						<div className="h-40 bg-gradient-to-br from-gray-800 to-gray-900 relative flex items-center justify-center overflow-hidden">
							<div className="text-white/10 group-hover:text-white/20 transition-colors font-display font-bold text-4xl tracking-tighter transform group-hover:scale-110 duration-500">
								{item.image.toUpperCase()}
							</div>
							<div className="absolute top-3 right-3 bg-green-500/20 text-green-400 text-[10px] font-bold px-2 py-1 rounded-full border border-green-500/20 flex items-center gap-1 z-10">
								<CheckCircle2 size={10} />
								SHIPPED
							</div>
							<div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-60" />
						</div>

						<div className="p-5 flex-1 flex flex-col">
							<h4 className="font-medium text-white text-lg mb-1 group-hover:text-primary transition-colors">
								{item.title}
							</h4>
							<p className="text-sm text-muted-foreground mb-4">
								Solved:{" "}
								<span className="text-gray-400">
									{item.pain}
								</span>
							</p>

							<div className="mt-auto flex items-center justify-between pt-4 border-t border-white/5">
								<div className="flex items-center gap-2 text-xs text-gray-400 hover:text-white cursor-pointer transition-colors">
									<GitPullRequest size={14} />
									<span className="font-mono">{item.pr}</span>
								</div>
								<div className="text-xs font-mono text-primary bg-primary/10 px-2 py-1 rounded border border-primary/10">
									{item.adoption}
								</div>
							</div>
						</div>
					</motion.div>
				))}
			</div>
		</div>
	);
}
