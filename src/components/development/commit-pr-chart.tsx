import {
	Card,
	CardContent,
	CardHeader,
	CardDescription,
	CardTitle,
} from "@/components/ui/card";
import { CommitPR } from "@/types/code";
import {
	Bar,
	BarChart,
	CartesianGrid,
	ResponsiveContainer,
	XAxis,
	YAxis,
	Tooltip,
} from "recharts";

export const CommitPRChart = ({
	commitPRData,
}: {
	commitPRData: CommitPR[];
}) => {
	return (
		<Card>
			<CardHeader>
				<CardTitle>Commits & Pull Requests</CardTitle>
				<CardDescription>
					Development activity over the last 7 days
				</CardDescription>
			</CardHeader>
			<CardContent>
				<div className="h-80 w-full">
					<ResponsiveContainer width="100%" height="100%">
						<BarChart data={commitPRData}>
							<CartesianGrid
								strokeDasharray="3 3"
								stroke="var(--border)"
							/>
							<XAxis
								dataKey="name"
								stroke="var(--muted-foreground)"
							/>
							<YAxis stroke="var(--muted-foreground)" />
							<Tooltip
								contentStyle={{
									backgroundColor: "var(--card)",
									border: "1px solid var(--border)",
									borderRadius: "var(--radius)",
								}}
							/>
							<Bar
								dataKey="commits"
								fill="var(--chart-1)"
								name="Commits"
							/>
							<Bar
								dataKey="prs"
								fill="var(--chart-3)"
								name="PRs"
							/>
						</BarChart>
					</ResponsiveContainer>
				</div>
			</CardContent>
		</Card>
	);
};
