"use client";
import { useFeedbackStore } from "@/zustand/providers/feedback-store-provider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	LineChart,
	Line,
	XAxis,
	YAxis,
	CartesianGrid,
	Tooltip,
	Legend,
	ResponsiveContainer,
} from "recharts";
import { format, subDays, eachDayOfInterval } from "date-fns";

export function SentimentChart() {
	const { feedbackItems, filters } = useFeedbackStore((state) => ({
		feedbackItems: state.feedbackItems,
		filters: state.filters,
	}));

	// Determine date range based on filter
	const getDateRange = () => {
		const endDate = new Date();
		let startDate: Date;
		switch (filters.dateRange) {
			case "last7days":
				startDate = subDays(endDate, 7);
				break;
			case "last30days":
				startDate = subDays(endDate, 30);
				break;
			case "custom":
				// For custom, assume last 7 days as fallback (implement custom range logic if needed)
				startDate = subDays(endDate, 7);
				break;
			default:
				startDate = subDays(endDate, 7);
		}
		return { startDate, endDate };
	};

	// Get all dates in the range
	const { startDate, endDate } = getDateRange();
	const dateRange = eachDayOfInterval({ start: startDate, end: endDate }).map(
		(date) => format(date, "yyyy-MM-dd")
	);

	// Aggregate sentiment data
	const sentimentData = dateRange.map((date) => {
		const itemsOnDate = feedbackItems.filter(
			(item) =>
				format(new Date(item.createdAt), "yyyy-MM-dd") === date &&
				(!filters.sentiment ||
					filters.sentiment === "all" ||
					item.sentiment === filters.sentiment.toUpperCase())
		);

		return {
			date,
			Positive: itemsOnDate.filter(
				(item) => item.sentiment === "POSITIVE"
			).length,
			Neutral: itemsOnDate.filter((item) => item.sentiment === "NEUTRAL")
				.length,
			Negative: itemsOnDate.filter(
				(item) => item.sentiment === "NEGATIVE"
			).length,
		};
	});

	// Filter out dates with no data to optimize chart
	const filteredSentimentData = sentimentData.filter(
		(data) => data.Positive > 0 || data.Neutral > 0 || data.Negative > 0
	);

	return (
		<Card>
			<CardHeader>
				<CardTitle>Sentiment Trends</CardTitle>
			</CardHeader>
			<CardContent className="p-4">
				{filteredSentimentData.length > 0 ? (
					<div className="h-[300px]">
						<ResponsiveContainer width="100%" height="100%">
							<LineChart
								data={filteredSentimentData}
								margin={{
									top: 5,
									right: 30,
									left: 20,
									bottom: 5,
								}}
							>
								<CartesianGrid
									strokeDasharray="3 3"
									stroke="#e5e7eb"
								/>
								<XAxis
									dataKey="date"
									tickFormatter={(date) =>
										format(new Date(date), "MMM dd")
									}
									stroke="#6b7280"
								/>
								<YAxis
									label={{
										value: "Count",
										angle: -90,
										position: "insideLeft",
										offset: -5,
										fill: "#6b7280",
									}}
									stroke="#6b7280"
								/>
								<Tooltip
									formatter={(value: number) => [
										value,
										"Count",
									]}
									labelFormatter={(label) =>
										format(new Date(label), "MMMM dd, yyyy")
									}
									contentStyle={{
										backgroundColor: "#ffffff",
										border: "1px solid #e5e7eb",
										borderRadius: "4px",
									}}
								/>
								<Legend verticalAlign="top" height={36} />
								<Line
									type="monotone"
									dataKey="Positive"
									stroke="#10B981"
									fill="rgba(16, 185, 129, 0.2)"
									strokeWidth={2}
									dot={false}
								/>
								<Line
									type="monotone"
									dataKey="Neutral"
									stroke="#6B7280"
									fill="rgba(107, 114, 128, 0.2)"
									strokeWidth={2}
									dot={false}
								/>
								<Line
									type="monotone"
									dataKey="Negative"
									stroke="#EF4444"
									fill="rgba(239, 68, 68, 0.2)"
									strokeWidth={2}
									dot={false}
								/>
							</LineChart>
						</ResponsiveContainer>
					</div>
				) : (
					<div className="flex items-center justify-center h-[300px] text-muted-foreground">
						No sentiment data available for the selected period.
					</div>
				)}
			</CardContent>
		</Card>
	);
}
