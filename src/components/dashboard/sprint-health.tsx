"use client";

import {
	Area,
	AreaChart,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";
import { TrendingDown, TrendingUp, AlertCircle } from "lucide-react";
import { useProductStore } from "@/zustand/providers/product-store-provider";
import { cn } from "@/lib/utils";

export function SprintHealth() {
	const sprintHealth = useProductStore((state) => state.sprintHealth);

	return (
		<div className="space-y-6">
			<div className="flex items-end justify-between">
				<div>
					<div className="text-4xl font-display font-bold text-white mb-1">
						{sprintHealth.completed}/{sprintHealth.total}
					</div>
					<p className="text-muted-foreground text-sm">
						Issues completed • {sprintHealth.daysRemaining} days
						remaining
					</p>
				</div>
				<div className="text-right">
					<div
						className={cn(
							"flex items-center gap-1 font-medium px-2 py-1 rounded-lg border",
							sprintHealth.delta < 0
								? "text-red-400 bg-red-400/10 border-red-400/20"
								: "text-green-400 bg-green-400/10 border-green-400/20"
						)}
					>
						{sprintHealth.delta < 0 ? (
							<TrendingDown size={16} />
						) : (
							<TrendingUp size={16} />
						)}
						<span>
							{sprintHealth.delta > 0 ? "+" : ""}
							{sprintHealth.delta}%
						</span>
					</div>
					<p className="text-muted-foreground text-xs mt-1">
						vs last sprint
					</p>
				</div>
			</div>

			<div className="h-[120px] w-full -ml-4">
				<ResponsiveContainer width="100%" height="100%">
					<AreaChart data={sprintHealth.velocityData}>
						<defs>
							<linearGradient
								id="colorVelocity"
								x1="0"
								y1="0"
								x2="0"
								y2="1"
							>
								<stop
									offset="5%"
									stopColor="#7c3aed"
									stopOpacity={0.3}
								/>
								<stop
									offset="95%"
									stopColor="#7c3aed"
									stopOpacity={0}
								/>
							</linearGradient>
						</defs>
						<XAxis dataKey="name" hide />
						<YAxis hide />
						<Tooltip
							contentStyle={{
								backgroundColor: "#1a1a1a",
								border: "1px solid #333",
								borderRadius: "8px",
							}}
							itemStyle={{ color: "#fff" }}
						/>
						<Area
							type="monotone"
							dataKey="velocity"
							stroke="#7c3aed"
							strokeWidth={2}
							fillOpacity={1}
							fill="url(#colorVelocity)"
						/>
					</AreaChart>
				</ResponsiveContainer>
			</div>

			{sprintHealth.blockers.length > 0 && (
				<div className="space-y-3">
					<h4 className="text-sm font-medium text-white flex items-center gap-2">
						<AlertCircle size={14} className="text-red-400" />
						Top Blockers
					</h4>
					<div className="space-y-2">
						{sprintHealth.blockers.map((blocker, idx) => (
							<div
								key={idx}
								className={cn(
									"border p-3 rounded-lg text-sm",
									idx === 0
										? "bg-red-500/5 border-red-500/10"
										: "bg-orange-500/5 border-orange-500/10"
								)}
							>
								<span
									className={cn(
										"font-medium block mb-1",
										idx === 0
											? "text-red-300"
											: "text-orange-300"
									)}
								>
									{blocker.team}
								</span>
								<span className="text-muted-foreground">
									{blocker.description}
								</span>
							</div>
						))}
					</div>
				</div>
			)}
		</div>
	);
}
