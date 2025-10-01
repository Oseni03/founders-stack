import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { FileText, Users } from "lucide-react";

export const QuickActions = () => {
	return (
		<Card>
			<CardHeader>
				<CardTitle>Quick Actions</CardTitle>
			</CardHeader>
			<CardContent>
				<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
					<Button
						variant="outline"
						className="justify-start h-auto p-4"
						disabled
					>
						<div className="flex items-center gap-3">
							<Users className="w-5 h-5" />
							<div className="text-left">
								<div className="font-medium">
									Invite Organization Members
								</div>
								<div className="text-sm text-muted-foreground">
									Add new users to your organization
								</div>
							</div>
						</div>
					</Button>

					<Button
						variant="outline"
						className="justify-start h-auto p-4"
						disabled
					>
						<div className="flex items-center gap-3">
							<FileText className="w-5 h-5" />
							<div className="text-left">
								<div className="font-medium">Export Data</div>
								<div className="text-sm text-muted-foreground">
									Download your notes and data
								</div>
							</div>
						</div>
					</Button>
				</div>
			</CardContent>
		</Card>
	);
};
