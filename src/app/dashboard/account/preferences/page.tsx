import React from "react";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
	CardDescription,
} from "@/components/ui/card";
import { ThemeCard } from "@/components/settings/theme";
import { Settings2 } from "lucide-react";

export default function AccountPreferencesPage() {
	return (
		<div className="space-y-6">
			<div className="grid gap-6">
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<Settings2 className="h-4 w-4" />
							Account Preferences
						</CardTitle>
						<CardDescription>
							Manage your account preferences and settings.
						</CardDescription>
					</CardHeader>
					<CardContent>
						<p className="text-sm text-muted-foreground">
							Configure your personalized experience below.
						</p>
					</CardContent>
				</Card>

				<ThemeCard />
			</div>
		</div>
	);
}
