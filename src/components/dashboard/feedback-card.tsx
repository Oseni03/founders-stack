"use client";

import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	BarChart,
	Bar,
	XAxis,
	YAxis,
	CartesianGrid,
	Tooltip,
	ResponsiveContainer,
} from "recharts";
import { MessageSquare, ThumbsUp } from "lucide-react";
import Link from "next/link";
import type { Metrics } from "@/lib/schemas";

interface FeedbackCardProps {
	productId: string;
	data: Metrics["feedback"];
}

const SENTIMENT_COLORS = {
	positive: "#22c55e",
	neutral: "#6b7280",
	negative: "#ef4444",
};

export function FeedbackCard({ productId, data }: FeedbackCardProps) {
	return (
		<Link href={`/products/${productId}/feedback`}>
			<Card className="cursor-pointer transition-all hover:shadow-lg hover:border-primary">
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<MessageSquare className="h-5 w-5" />
						Feedback
					</CardTitle>
					<CardDescription>User sentiment & reviews</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					{/* Key Metrics - Sentiment Score */}
					<div className="rounded-lg bg-muted p-4">
						<p className="text-sm font-medium text-muted-foreground">
							Overall Sentiment
						</p>
						<div className="mt-2 flex items-end gap-2">
							<p className="text-3xl font-bold text-green-600">
								{(data.sentiment * 100).toFixed(0)}%
							</p>
							<p className="mb-1 text-sm text-muted-foreground">
								positive
							</p>
						</div>
						<p className="mt-2 text-sm text-muted-foreground">
							{data.totalFeedback} total feedback entries
						</p>
					</div>

					{/* Sentiment Distribution Bar Chart */}
					<div>
						<p className="mb-2 text-sm font-semibold text-foreground">
							Sentiment Distribution
						</p>
						<div className="h-32 w-full">
							<ResponsiveContainer width="100%" height="100%">
								<BarChart data={data.feedbackSentiment}>
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
										formatter={(value) => `${value}%`}
									/>
									<Bar
										dataKey="value"
										fill="var(--chart-1)"
										radius={[8, 8, 0, 0]}
									/>
								</BarChart>
							</ResponsiveContainer>
						</div>
					</div>

					{/* Recent Feedback List */}
					<div>
						<p className="mb-2 text-sm font-semibold text-foreground">
							Recent Feedback
						</p>
						<div className="space-y-2">
							{data.recentFeedback.map((feedback) => (
								<div
									key={feedback.id}
									className="rounded-lg border border-border bg-card p-3"
								>
									<div className="flex items-start justify-between gap-2">
										<p className="text-sm text-foreground">
											{feedback.text}
										</p>
										<div
											className="mt-1 inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium text-white"
											style={{
												backgroundColor:
													SENTIMENT_COLORS[
														feedback.sentiment
													],
											}}
										>
											{feedback.sentiment ===
												"positive" && (
												<ThumbsUp className="h-3 w-3" />
											)}
											{feedback.sentiment
												.charAt(0)
												.toUpperCase() +
												feedback.sentiment.slice(1)}
										</div>
									</div>
									<p className="mt-1 text-xs text-muted-foreground">
										{feedback.date}
									</p>
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
