"use client";

import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	LineChart,
	Line,
	XAxis,
	YAxis,
	CartesianGrid,
	Tooltip,
	ResponsiveContainer,
} from "recharts";
import { MessageSquare, Bell } from "lucide-react";
import Link from "next/link";
import type { Metrics } from "@/lib/schemas";

interface CommunicationCardProps {
	data: Metrics["communication"];
}

export function CommunicationCard({ data }: CommunicationCardProps) {
	const sentimentPercent = Math.round(data.sentiment * 100);

	return (
		<Link href="/dashboard/communication">
			<Card className="cursor-pointer transition-all hover:shadow-lg hover:border-primary">
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<MessageSquare className="h-5 w-5" />
						Communication
					</CardTitle>
					<CardDescription>Team messaging & mentions</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					{/* Key Metric - Unread Mentions */}
					<div className="rounded-lg bg-muted p-4">
						<p className="text-sm font-medium text-muted-foreground">
							Unread Mentions
						</p>
						<div className="mt-2 flex items-center gap-2">
							<Bell className="h-5 w-5 text-orange-500" />
							<p className="text-3xl font-bold">
								{data.unreadMentions}
							</p>
						</div>
						<p className="mt-2 text-sm text-muted-foreground">
							Sentiment:{" "}
							<span className="font-semibold text-foreground">
								{sentimentPercent}% positive
							</span>
						</p>
					</div>

					{/* Message Volume Trend */}
					<div className="h-40 w-full">
						<ResponsiveContainer width="100%" height="100%">
							<LineChart data={data.messageTrendData}>
								<CartesianGrid
									strokeDasharray="3 3"
									stroke="var(--border)"
								/>
								<XAxis
									dataKey="name"
									stroke="var(--muted-foreground)"
									style={{ fontSize: "12px" }}
								/>
								<YAxis
									stroke="var(--muted-foreground)"
									style={{ fontSize: "12px" }}
								/>
								<Tooltip
									contentStyle={{
										backgroundColor: "var(--card)",
										border: "1px solid var(--border)",
										borderRadius: "var(--radius)",
									}}
									formatter={(value) => `${value} messages`}
								/>
								<Line
									type="monotone"
									dataKey="volume"
									stroke="var(--chart-1)"
									strokeWidth={2}
									dot={false}
								/>
							</LineChart>
						</ResponsiveContainer>
					</div>

					{/* Recent Threads */}
					<div className="space-y-2">
						<p className="text-sm font-semibold text-foreground">
							Recent Threads
						</p>
						<div className="space-y-1">
							{data.recentThreads.slice(0, 3).map((thread) => (
								<div
									key={thread.id}
									className="flex items-start justify-between rounded bg-muted p-2 text-sm"
								>
									<div className="flex-1">
										<p className="font-medium text-blue-600">
											{thread.channel}
										</p>
										<p className="truncate text-xs text-muted-foreground">
											{thread.preview}
										</p>
									</div>
									<span className="ml-2 rounded-full bg-orange-100 px-2 py-1 text-xs font-medium text-orange-700">
										{thread.mentions}
									</span>
								</div>
							))}
						</div>
					</div>

					{/* Insight */}
					<div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-900">
						<p className="font-medium">Insight:</p>
						<p>{data.insight}</p>
					</div>
				</CardContent>
			</Card>
		</Link>
	);
}
