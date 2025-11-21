import { useState } from "react";
import { GlassCard } from "@/components/dashboard/glass-card";
import { DayPicker } from "react-day-picker";
import { motion, AnimatePresence } from "framer-motion";
import {
	Calendar as CalendarIcon,
	ArrowRight,
	History as HistoryIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import "react-day-picker/dist/style.css";
import { useProductStore } from "@/zustand/providers/product-store-provider";

export function HistoryPage() {
	const snapshots = useProductStore((state) => state.snapshots);
	const [selectedDate, setSelectedDate] = useState<Date | undefined>(
		new Date()
	);

	const dateKey = selectedDate?.toISOString().split("T")[0] || "";
	const snapshot = snapshots[dateKey];

	return (
		<>
			<header className="mb-8 flex items-center justify-between">
				<div>
					<h1 className="text-3xl font-display font-bold text-white mb-2">
						History
					</h1>
					<p className="text-muted-foreground">
						Time travel through your product operations
					</p>
				</div>
			</header>

			<div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
				<div className="lg:col-span-4 space-y-6">
					<GlassCard className="p-6">
						<style>{`
              .rdp { margin: 0; --rdp-cell-size: 40px; --rdp-accent-color: hsl(var(--primary)); }
              .rdp-day_selected:not([disabled]) { background-color: hsl(var(--primary)); color: white; font-weight: bold; }
              .rdp-button:hover:not([disabled]):not(.rdp-day_selected) { background-color: rgba(255,255,255,0.1); }
              .rdp-caption_label { color: white; font-family: var(--font-display); font-size: 1.1rem; }
              .rdp-head_cell { color: #888; font-weight: 500; }
              .rdp-day { color: #ccc; }
              .rdp-day_today { color: hsl(var(--primary)); font-weight: bold; }
            `}</style>
						<DayPicker
							mode="single"
							selected={selectedDate}
							onSelect={setSelectedDate}
							className="bg-transparent"
							modifiers={{
								hasSnapshot: (date) =>
									!!snapshots[
										date.toISOString().split("T")[0]
									],
							}}
							modifiersStyles={{
								hasSnapshot: {
									borderBottom:
										"2px solid hsl(var(--primary))",
								},
							}}
						/>
					</GlassCard>

					<div className="bg-white/5 border border-white/5 rounded-xl p-4 text-sm text-muted-foreground">
						<div className="flex items-center gap-2 mb-2">
							<CalendarIcon size={16} />
							<span className="font-medium text-white">
								Pro Tip
							</span>
						</div>
						<p>
							Dates with an underline have detailed snapshots
							available. Click to freeze the dashboard in time.
						</p>
					</div>
				</div>

				<div className="lg:col-span-8">
					<AnimatePresence mode="wait">
						{snapshot ? (
							<motion.div
								key={dateKey}
								initial={{ opacity: 0, x: 20 }}
								animate={{ opacity: 1, x: 0 }}
								exit={{ opacity: 0, x: -20 }}
								className="space-y-6"
							>
								<div className="flex items-center justify-between">
									<h2 className="text-2xl font-display font-bold text-white">
										Snapshot:{" "}
										{selectedDate?.toLocaleDateString(
											"en-US",
											{
												weekday: "long",
												year: "numeric",
												month: "long",
												day: "numeric",
											}
										)}
									</h2>
									<button className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2">
										Load Full Dashboard{" "}
										<ArrowRight size={16} />
									</button>
								</div>

								<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
									<GlassCard className="bg-gradient-to-br from-purple-500/10 to-transparent border-purple-500/20">
										<div className="text-muted-foreground text-sm mb-1">
											Velocity
										</div>
										<div className="text-3xl font-bold text-white mb-2">
											{snapshot.velocity} points
										</div>
										<div className="text-xs text-purple-300 bg-purple-500/20 px-2 py-1 rounded w-fit">
											{snapshot.velocity > 25
												? "High Velocity"
												: "Normal Pace"}
										</div>
									</GlassCard>

									<GlassCard
										className={cn(
											"bg-gradient-to-br border-opacity-20",
											snapshot.blockers > 0
												? "from-red-500/10 border-red-500"
												: "from-green-500/10 border-green-500"
										)}
									>
										<div className="text-muted-foreground text-sm mb-1">
											Blockers
										</div>
										<div className="text-3xl font-bold text-white mb-2">
											{snapshot.blockers}
										</div>
										<div
											className={cn(
												"text-xs px-2 py-1 rounded w-fit",
												snapshot.blockers > 0
													? "text-red-300 bg-red-500/20"
													: "text-green-300 bg-green-500/20"
											)}
										>
											{snapshot.blockers > 0
												? "Needs Attention"
												: "All Clear"}
										</div>
									</GlassCard>

									<GlassCard className="bg-gradient-to-br from-blue-500/10 to-transparent border-blue-500/20">
										<div className="text-muted-foreground text-sm mb-1">
											Top Pain
										</div>
										<div className="text-lg font-bold text-white mb-2 line-clamp-2 leading-snug">
											{snapshot.topPain}
										</div>
										<div className="text-xs text-blue-300 bg-blue-500/20 px-2 py-1 rounded w-fit">
											Critical Issue
										</div>
									</GlassCard>
								</div>

								<GlassCard title="Summary of the Day">
									<div className="space-y-4">
										<div className="flex gap-4">
											<div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
												<CalendarIcon
													className="text-primary"
													size={20}
												/>
											</div>
											<div className="space-y-1">
												<p className="text-gray-300 leading-relaxed">
													{snapshot.summary}
													{snapshot.blockers > 0 && (
														<span className="block mt-2 text-red-300 bg-red-500/10 p-2 rounded border border-red-500/20">
															⚠️{" "}
															{snapshot.blockers}{" "}
															critical blockers
															identified in system
															flow.
														</span>
													)}
												</p>
											</div>
										</div>
									</div>
								</GlassCard>
							</motion.div>
						) : (
							<div className="h-full min-h-[400px] flex flex-col items-center justify-center text-muted-foreground border border-dashed border-white/10 rounded-3xl bg-white/5">
								<HistoryIcon
									size={48}
									className="mb-4 opacity-20"
								/>
								<p className="text-lg font-medium">
									No snapshot data for this date
								</p>
								<p className="text-sm">
									Select a highlighted date to view history
								</p>
							</div>
						)}
					</AnimatePresence>
				</div>
			</div>
		</>
	);
}
