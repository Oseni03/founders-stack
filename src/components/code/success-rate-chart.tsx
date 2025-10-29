import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { BuildTrend } from "@/types/code";
import {
	CartesianGrid,
	Line,
	LineChart,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";

export const SuccessRateChart = ({
	buildTrendData,
}: {
	buildTrendData: BuildTrend[];
}) => {
	return (
		<Card>
			<CardHeader>
				<CardTitle>Build Success Rate Trend</CardTitle>
				<CardDescription>
					Build success rate over the last 14 days
				</CardDescription>
			</CardHeader>
			<CardContent>
				<div className="h-80 w-full">
					<ResponsiveContainer width="100%" height="100%">
						<LineChart data={buildTrendData}>
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
								domain={[0, 100]}
							/>
							<Tooltip
								contentStyle={{
									backgroundColor: "var(--card)",
									border: "1px solid var(--border)",
									borderRadius: "var(--radius)",
								}}
								formatter={(value) => `${value}%`}
							/>
							<Line
								type="monotone"
								dataKey="successRate"
								stroke="var(--chart-1)"
								strokeWidth={2}
								dot={{
									fill: "var(--chart-1)",
								}}
							/>
						</LineChart>
					</ResponsiveContainer>
				</div>
			</CardContent>
		</Card>
	);
};
