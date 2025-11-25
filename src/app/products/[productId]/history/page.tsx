"use client";

import { useMemo, useState } from "react";
import { GlassCard } from "@/components/dashboard/glass-card";
import { motion, AnimatePresence } from "framer-motion";
import {
	Calendar as CalendarIcon,
	ArrowRight,
	History as HistoryIcon,
	Info,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useProductStore } from "@/zustand/providers/product-store-provider";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

export default function HistoryPage() {
	const snapshots = useProductStore((state) => state.snapshots);
	const [selectedDate, setSelectedDate] = useState<Date | undefined>(
		new Date()
	);

	// Memoize snapshot dates to avoid recalculation on every render
	const snapshotDates = useMemo(() => {
		return Object.keys(snapshots).map((key) => new Date(key + "T00:00:00"));
	}, [snapshots]);

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
				{/* Calendar Section */}
				<div className="lg:col-span-4 space-y-6">
					<GlassCard className="p-6">
						<Calendar
							mode="single"
							selected={selectedDate}
							onSelect={setSelectedDate}
							className="rounded-md border"
							modifiers={{
								hasSnapshot: snapshotDates,
							}}
							modifiersClassNames={{
								hasSnapshot:
									"relative after:absolute after:bottom-1 after:left-1/2 after:-translate-x-1/2 after:w-1 after:h-1 after:rounded-full after:bg-primary",
							}}
							classNames={{
								months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
								month: "space-y-4",
								caption:
									"flex justify-center pt-1 relative items-center",
								caption_label: "text-sm font-medium text-white",
								nav: "space-x-1 flex items-center",
								nav_button: cn(
									"h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100",
									"text-white hover:bg-white/10 rounded-md transition-colors"
								),
								nav_button_previous: "absolute left-1",
								nav_button_next: "absolute right-1",
								table: "w-full border-collapse space-y-1",
								head_row: "flex",
								head_cell:
									"text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]",
								row: "flex w-full mt-2",
								cell: cn(
									"relative p-0 text-center text-sm focus-within:relative focus-within:z-20 [&:has([aria-selected])]:bg-accent",
									"first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md"
								),
								day: cn(
									"h-9 w-9 p-0 font-normal aria-selected:opacity-100",
									"text-white hover:bg-white/10 rounded-md transition-colors"
								),
								day_selected:
									"bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
								day_today:
									"bg-accent text-accent-foreground font-bold",
								day_outside: "text-muted-foreground opacity-50",
								day_disabled:
									"text-muted-foreground opacity-50",
								day_range_middle:
									"aria-selected:bg-accent aria-selected:text-accent-foreground",
								day_hidden: "invisible",
							}}
						/>
					</GlassCard>

					<Alert className="bg-white/5 border-white/10">
						<Info className="h-4 w-4 text-primary" />
						<AlertTitle className="text-white">Pro Tip</AlertTitle>
						<AlertDescription className="text-muted-foreground">
							Dates with a dot indicator have detailed snapshots
							available. Click to freeze the dashboard in time.
						</AlertDescription>
					</Alert>
				</div>

				{/* Snapshot Preview Section */}
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
								<div className="flex items-center justify-between flex-wrap gap-4">
									<div>
										<h2 className="text-2xl font-display font-bold text-white">
											Snapshot
										</h2>
										<p className="text-muted-foreground text-sm mt-1">
											{selectedDate?.toLocaleDateString(
												"en-US",
												{
													weekday: "long",
													year: "numeric",
													month: "long",
													day: "numeric",
												}
											)}
										</p>
									</div>
									<Button className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2">
										Load Full Dashboard{" "}
										<ArrowRight size={16} />
									</Button>
								</div>

								<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
									<GlassCard className="bg-gradient-to-br from-purple-500/10 to-transparent border-purple-500/20">
										<div className="text-muted-foreground text-sm mb-1">
											Velocity
										</div>
										<div className="text-3xl font-bold text-white mb-2">
											{snapshot.velocity} points
										</div>
										<Badge
											variant="secondary"
											className="bg-purple-500/20 text-purple-300 border-purple-500/30 hover:bg-purple-500/30"
										>
											{snapshot.velocity > 25
												? "High Velocity"
												: "Normal Pace"}
										</Badge>
									</GlassCard>

									<GlassCard
										className={cn(
											"bg-gradient-to-br",
											snapshot.blockers > 0
												? "from-red-500/10 border-red-500/20"
												: "from-green-500/10 border-green-500/20"
										)}
									>
										<div className="text-muted-foreground text-sm mb-1">
											Blockers
										</div>
										<div className="text-3xl font-bold text-white mb-2">
											{snapshot.blockers}
										</div>
										<Badge
											variant="secondary"
											className={cn(
												snapshot.blockers > 0
													? "bg-red-500/20 text-red-300 border-red-500/30 hover:bg-red-500/30"
													: "bg-green-500/20 text-green-300 border-green-500/30 hover:bg-green-500/30"
											)}
										>
											{snapshot.blockers > 0
												? "Needs Attention"
												: "All Clear"}
										</Badge>
									</GlassCard>

									<GlassCard className="bg-gradient-to-br from-blue-500/10 to-transparent border-blue-500/20">
										<div className="text-muted-foreground text-sm mb-1">
											Top Pain
										</div>
										<div className="text-lg font-bold text-white mb-2 line-clamp-2 leading-snug">
											{snapshot.topPain}
										</div>
										<Badge
											variant="secondary"
											className="bg-blue-500/20 text-blue-300 border-blue-500/30 hover:bg-blue-500/30"
										>
											Critical Issue
										</Badge>
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
												</p>
												{snapshot.blockers > 0 && (
													<Alert className="mt-3 bg-red-500/10 border-red-500/20">
														<AlertDescription className="text-red-300">
															⚠️{" "}
															{snapshot.blockers}{" "}
															critical blockers
															identified in system
															flow.
														</AlertDescription>
													</Alert>
												)}
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
