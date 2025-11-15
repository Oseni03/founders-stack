import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";

export const SuccessRateCard = ({
	buildSuccessRate,
}: {
	buildSuccessRate: number;
}) => {
	return (
		<Card>
			<CardHeader className="pb-3">
				<CardTitle className="flex items-center gap-2 text-sm font-medium">
					<AlertCircle className="h-4 w-4 text-chart-4" />
					Success Rate
				</CardTitle>
			</CardHeader>
			<CardContent>
				<p className="text-3xl font-bold">
					{buildSuccessRate.toFixed(1)}%
				</p>
				<p className="mt-1 text-xs text-muted-foreground">
					Build success
				</p>
			</CardContent>
		</Card>
	);
};
