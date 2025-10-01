import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Users } from "lucide-react";
import { Progress } from "../ui/progress";

export const UsageCard = () => {
	return (
		<Card>
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					<Users className="w-5 h-5" />
					Usage & Limits
				</CardTitle>
			</CardHeader>
			<CardContent className="space-y-6">
				<div className="space-y-2">
					<div className="flex justify-between text-sm">
						<span>Users</span>
						<span className="font-medium">
							{5} / {20}
						</span>
					</div>
					<Progress value={(5 / 20) * 100} className="h-2" />
				</div>

				<div className="space-y-2">
					<div className="flex justify-between text-sm">
						<span>Integrations</span>
						<span className="font-medium">3 / 20</span>
					</div>
					<Progress value={(3 / 20) * 100} className="h-2" />
				</div>
			</CardContent>
		</Card>
	);
};
