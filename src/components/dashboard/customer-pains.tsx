import { useState } from "react";
import {
	MessageSquare,
	Ticket,
	ExternalLink,
	ChevronDown,
	ChevronUp,
	Github,
	MessageCircle,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useProductStore } from "@/zustand/providers/product-store-provider";

export function CustomerPains() {
	const { topPains, createPrioritizationPlan, isLoading } = useProductStore(
		(state) => state
	);
	const [expanded, setExpanded] = useState<string | null>(null);

	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between text-xs text-muted-foreground px-2 uppercase tracking-wider font-medium">
				<span>Theme</span>
				<span>Impact</span>
			</div>

			<div className="space-y-3">
				{topPains.map((pain, i) => {
					const isExpanded = expanded === pain.theme;

					return (
						<motion.div
							key={pain.theme}
							initial={{ opacity: 0, x: -20 }}
							animate={{ opacity: 1, x: 0 }}
							transition={{ delay: i * 0.1 }}
							className={cn(
								"group rounded-xl bg-white/5 border transition-all cursor-pointer overflow-hidden relative",
								isExpanded
									? "border-primary/30 bg-white/10"
									: "border-white/5 hover:bg-white/10 hover:border-primary/30"
							)}
							onClick={() =>
								setExpanded(isExpanded ? null : pain.theme)
							}
						>
							<div
								className={cn(
									"absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-primary to-transparent transition-opacity",
									isExpanded
										? "opacity-100"
										: "opacity-0 group-hover:opacity-100"
								)}
							/>

							<div className="p-3">
								<div className="flex justify-between items-start mb-2">
									<h4
										className={cn(
											"font-medium transition-colors flex items-center gap-2",
											isExpanded
												? "text-primary"
												: "text-white group-hover:text-primary"
										)}
									>
										{pain.theme}
										{isExpanded ? (
											<ChevronUp size={14} />
										) : (
											<ChevronDown
												size={14}
												className="opacity-0 group-hover:opacity-50"
											/>
										)}
									</h4>
									<div className="text-right">
										<div className="text-white font-mono font-medium">
											{pain.mrr}
										</div>
										<div className="text-[10px] text-muted-foreground">
											MRR at risk
										</div>
									</div>
								</div>

								<p className="text-sm text-muted-foreground italic mb-3 line-clamp-1">
									{`"${pain.quote}"`}
								</p>

								<div className="flex items-center gap-4 text-xs text-gray-400">
									<div className="flex items-center gap-1.5">
										<Ticket size={12} />
										<span>{pain.tickets} tickets</span>
									</div>
									<div className="flex items-center gap-1.5">
										<MessageSquare size={12} />
										<span>{pain.score}/10 Pain Score</span>
									</div>
								</div>
							</div>

							<AnimatePresence>
								{isExpanded && (
									<motion.div
										initial={{ height: 0, opacity: 0 }}
										animate={{ height: "auto", opacity: 1 }}
										exit={{ height: 0, opacity: 0 }}
										className="bg-black/20 border-t border-white/5"
									>
										<div className="p-3 space-y-2">
											<div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
												Linked Evidence
											</div>
											{pain.linked.map((item, idx) => (
												<div
													key={idx}
													className="flex items-center gap-2 text-xs text-gray-300 p-1.5 hover:bg-white/5 rounded transition-colors"
												>
													{item.type === "linear" && (
														<div className="w-4 h-4 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-[8px]">
															L
														</div>
													)}
													{item.type ===
														"intercom" && (
														<div className="w-4 h-4 rounded-full bg-yellow-500/20 text-yellow-400 flex items-center justify-center">
															<MessageCircle
																size={10}
															/>
														</div>
													)}
													{item.type ===
														"zendesk" && (
														<div className="w-4 h-4 rounded-full bg-green-500/20 text-green-400 flex items-center justify-center text-[8px]">
															Z
														</div>
													)}
													{item.type === "github" && (
														<div className="w-4 h-4 rounded-full bg-gray-500/20 text-gray-400 flex items-center justify-center">
															<Github size={10} />
														</div>
													)}

													<span className="font-mono text-muted-foreground min-w-[60px]">
														{item.id}
													</span>
													<span className="truncate flex-1">
														{item.title}
													</span>
													<ExternalLink
														size={10}
														className="opacity-50 hover:opacity-100"
													/>
												</div>
											))}
										</div>
									</motion.div>
								)}
							</AnimatePresence>
						</motion.div>
					);
				})}
			</div>

			<button
				onClick={(e) => {
					e.stopPropagation();
					if (topPains[0])
						createPrioritizationPlan(topPains[0].theme);
				}}
				disabled={isLoading}
				className="w-full mt-4 py-3 rounded-xl bg-primary/10 border border-primary/20 text-primary font-medium hover:bg-primary/20 transition-colors flex items-center justify-center gap-2 text-sm group disabled:opacity-50"
			>
				<SparklesIcon className="w-4 h-4" />
				{isLoading ? "Creating..." : "Create Prioritization Plan"}
			</button>
		</div>
	);
}

function SparklesIcon({ className }: { className?: string }) {
	return (
		<svg
			className={className}
			xmlns="http://www.w3.org/2000/svg"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="2"
			strokeLinecap="round"
			strokeLinejoin="round"
		>
			<path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
		</svg>
	);
}
