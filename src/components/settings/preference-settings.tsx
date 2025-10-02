"use client";

import { useState } from "react";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

export function PreferenceSettings() {
	const [isLoading, setIsLoading] = useState(false);
	const [preferences, setPreferences] = useState({
		theme: "system",
		language: "en",
		timezone: "America/New_York",
		dateFormat: "MM/DD/YYYY",
		currency: "USD",
		compactMode: false,
		showMetrics: true,
		autoRefresh: true,
	});

	const handleSave = async () => {
		setIsLoading(true);
		try {
			const response = await fetch("/api/settings/preferences", {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(preferences),
			});

			if (response.ok) {
				toast.success("Preferences saved", {
					description:
						"Your preferences have been updated successfully.",
				});
			} else {
				throw new Error("Failed to save preferences");
			}
		} catch (error) {
			console.log("Preference save error:", error);
			toast.error("Error", {
				description: "Failed to save preferences. Please try again.",
			});
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<div className="space-y-6">
			<Card>
				<CardHeader>
					<CardTitle>Appearance</CardTitle>
					<CardDescription>
						Customize how the dashboard looks
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="space-y-2">
						<Label htmlFor="theme">Theme</Label>
						<Select
							value={preferences.theme}
							onValueChange={(value) =>
								setPreferences({ ...preferences, theme: value })
							}
						>
							<SelectTrigger id="theme">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="light">Light</SelectItem>
								<SelectItem value="dark">Dark</SelectItem>
								<SelectItem value="system">System</SelectItem>
							</SelectContent>
						</Select>
					</div>

					<Separator />

					<div className="flex items-center justify-between">
						<div className="space-y-0.5">
							<Label htmlFor="compact-mode">Compact Mode</Label>
							<p className="text-sm text-muted-foreground">
								Reduce spacing and padding throughout the
								interface
							</p>
						</div>
						<Switch
							id="compact-mode"
							checked={preferences.compactMode}
							onCheckedChange={(checked) =>
								setPreferences({
									...preferences,
									compactMode: checked,
								})
							}
						/>
					</div>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>Localization</CardTitle>
					<CardDescription>
						Set your language, timezone, and regional preferences
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="space-y-2">
						<Label htmlFor="language">Language</Label>
						<Select
							value={preferences.language}
							onValueChange={(value) =>
								setPreferences({
									...preferences,
									language: value,
								})
							}
						>
							<SelectTrigger id="language">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="en">English</SelectItem>
								<SelectItem value="es">Español</SelectItem>
								<SelectItem value="fr">Français</SelectItem>
								<SelectItem value="de">Deutsch</SelectItem>
							</SelectContent>
						</Select>
					</div>

					<div className="space-y-2">
						<Label htmlFor="timezone">Timezone</Label>
						<Select
							value={preferences.timezone}
							onValueChange={(value) =>
								setPreferences({
									...preferences,
									timezone: value,
								})
							}
						>
							<SelectTrigger id="timezone">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="America/New_York">
									Eastern Time (ET)
								</SelectItem>
								<SelectItem value="America/Chicago">
									Central Time (CT)
								</SelectItem>
								<SelectItem value="America/Denver">
									Mountain Time (MT)
								</SelectItem>
								<SelectItem value="America/Los_Angeles">
									Pacific Time (PT)
								</SelectItem>
								<SelectItem value="Europe/London">
									London (GMT)
								</SelectItem>
								<SelectItem value="Europe/Paris">
									Paris (CET)
								</SelectItem>
								<SelectItem value="Asia/Tokyo">
									Tokyo (JST)
								</SelectItem>
							</SelectContent>
						</Select>
					</div>

					<div className="space-y-2">
						<Label htmlFor="date-format">Date Format</Label>
						<Select
							value={preferences.dateFormat}
							onValueChange={(value) =>
								setPreferences({
									...preferences,
									dateFormat: value,
								})
							}
						>
							<SelectTrigger id="date-format">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="MM/DD/YYYY">
									MM/DD/YYYY
								</SelectItem>
								<SelectItem value="DD/MM/YYYY">
									DD/MM/YYYY
								</SelectItem>
								<SelectItem value="YYYY-MM-DD">
									YYYY-MM-DD
								</SelectItem>
							</SelectContent>
						</Select>
					</div>

					<div className="space-y-2">
						<Label htmlFor="currency">Currency</Label>
						<Select
							value={preferences.currency}
							onValueChange={(value) =>
								setPreferences({
									...preferences,
									currency: value,
								})
							}
						>
							<SelectTrigger id="currency">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="USD">USD ($)</SelectItem>
								<SelectItem value="EUR">EUR (€)</SelectItem>
								<SelectItem value="GBP">GBP (£)</SelectItem>
								<SelectItem value="JPY">JPY (¥)</SelectItem>
							</SelectContent>
						</Select>
					</div>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>Dashboard Behavior</CardTitle>
					<CardDescription>
						Control how the dashboard functions
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="flex items-center justify-between">
						<div className="space-y-0.5">
							<Label htmlFor="show-metrics">Show Metrics</Label>
							<p className="text-sm text-muted-foreground">
								Display metric cards on the dashboard
							</p>
						</div>
						<Switch
							id="show-metrics"
							checked={preferences.showMetrics}
							onCheckedChange={(checked) =>
								setPreferences({
									...preferences,
									showMetrics: checked,
								})
							}
						/>
					</div>

					<Separator />

					<div className="flex items-center justify-between">
						<div className="space-y-0.5">
							<Label htmlFor="auto-refresh">Auto Refresh</Label>
							<p className="text-sm text-muted-foreground">
								Automatically refresh data every 5 minutes
							</p>
						</div>
						<Switch
							id="auto-refresh"
							checked={preferences.autoRefresh}
							onCheckedChange={(checked) =>
								setPreferences({
									...preferences,
									autoRefresh: checked,
								})
							}
						/>
					</div>
				</CardContent>
			</Card>

			<div className="flex justify-end gap-2">
				<Button variant="outline">Reset to Defaults</Button>
				<Button onClick={handleSave} disabled={isLoading}>
					{isLoading && (
						<Loader2 className="mr-2 h-4 w-4 animate-spin" />
					)}
					Save Preferences
				</Button>
			</div>
		</div>
	);
}
