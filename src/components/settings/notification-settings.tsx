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
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

export function NotificationSettings() {
	const [isLoading, setIsLoading] = useState(false);
	const [notifications, setNotifications] = useState({
		email: {
			tasks: true,
			transactions: true,
			commits: false,
			errors: true,
			weekly_summary: true,
		},
		push: {
			tasks: true,
			transactions: false,
			commits: false,
			errors: true,
		},
		inApp: {
			tasks: true,
			transactions: true,
			commits: true,
			errors: true,
			mentions: true,
		},
	});

	const handleSave = async () => {
		setIsLoading(true);
		try {
			const response = await fetch("/api/settings/notifications", {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(notifications),
			});

			if (response.ok) {
				toast.success("Notifications updated", {
					description:
						"Your notification preferences have been saved.",
				});
			} else {
				throw new Error("Failed to update notifications");
			}
		} catch (error) {
			console.log("Notification update error:", error);
			toast.error("Error", {
				description:
					"Failed to update notifications. Please try again.",
			});
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<div className="space-y-6">
			<Card>
				<CardHeader>
					<CardTitle>Email Notifications</CardTitle>
					<CardDescription>
						Manage what you receive via email
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="flex items-center justify-between">
						<div className="space-y-0.5">
							<Label htmlFor="email-tasks">Task Updates</Label>
							<p className="text-sm text-muted-foreground">
								Notifications about task assignments and
								completions
							</p>
						</div>
						<Switch
							id="email-tasks"
							checked={notifications.email.tasks}
							onCheckedChange={(checked) =>
								setNotifications({
									...notifications,
									email: {
										...notifications.email,
										tasks: checked,
									},
								})
							}
						/>
					</div>

					<Separator />

					<div className="flex items-center justify-between">
						<div className="space-y-0.5">
							<Label htmlFor="email-transactions">
								Transaction Alerts
							</Label>
							<p className="text-sm text-muted-foreground">
								Get notified about new transactions and payments
							</p>
						</div>
						<Switch
							id="email-transactions"
							checked={notifications.email.transactions}
							onCheckedChange={(checked) =>
								setNotifications({
									...notifications,
									email: {
										...notifications.email,
										transactions: checked,
									},
								})
							}
						/>
					</div>

					<Separator />

					<div className="flex items-center justify-between">
						<div className="space-y-0.5">
							<Label htmlFor="email-commits">Code Commits</Label>
							<p className="text-sm text-muted-foreground">
								Updates about repository commits and pull
								requests
							</p>
						</div>
						<Switch
							id="email-commits"
							checked={notifications.email.commits}
							onCheckedChange={(checked) =>
								setNotifications({
									...notifications,
									email: {
										...notifications.email,
										commits: checked,
									},
								})
							}
						/>
					</div>

					<Separator />

					<div className="flex items-center justify-between">
						<div className="space-y-0.5">
							<Label htmlFor="email-errors">Error Alerts</Label>
							<p className="text-sm text-muted-foreground">
								Critical errors and system issues
							</p>
						</div>
						<Switch
							id="email-errors"
							checked={notifications.email.errors}
							onCheckedChange={(checked) =>
								setNotifications({
									...notifications,
									email: {
										...notifications.email,
										errors: checked,
									},
								})
							}
						/>
					</div>

					<Separator />

					<div className="flex items-center justify-between">
						<div className="space-y-0.5">
							<Label htmlFor="email-summary">
								Weekly Summary
							</Label>
							<p className="text-sm text-muted-foreground">
								Weekly digest of your activity and metrics
							</p>
						</div>
						<Switch
							id="email-summary"
							checked={notifications.email.weekly_summary}
							onCheckedChange={(checked) =>
								setNotifications({
									...notifications,
									email: {
										...notifications.email,
										weekly_summary: checked,
									},
								})
							}
						/>
					</div>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>Push Notifications</CardTitle>
					<CardDescription>
						Manage browser and mobile push notifications
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="flex items-center justify-between">
						<div className="space-y-0.5">
							<Label htmlFor="push-tasks">Task Updates</Label>
							<p className="text-sm text-muted-foreground">
								Real-time task notifications
							</p>
						</div>
						<Switch
							id="push-tasks"
							checked={notifications.push.tasks}
							onCheckedChange={(checked) =>
								setNotifications({
									...notifications,
									push: {
										...notifications.push,
										tasks: checked,
									},
								})
							}
						/>
					</div>

					<Separator />

					<div className="flex items-center justify-between">
						<div className="space-y-0.5">
							<Label htmlFor="push-errors">Error Alerts</Label>
							<p className="text-sm text-muted-foreground">
								Immediate notification of critical errors
							</p>
						</div>
						<Switch
							id="push-errors"
							checked={notifications.push.errors}
							onCheckedChange={(checked) =>
								setNotifications({
									...notifications,
									push: {
										...notifications.push,
										errors: checked,
									},
								})
							}
						/>
					</div>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>In-App Notifications</CardTitle>
					<CardDescription>
						Notifications shown within the dashboard
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="flex items-center justify-between">
						<div className="space-y-0.5">
							<Label htmlFor="inapp-mentions">Mentions</Label>
							<p className="text-sm text-muted-foreground">
								When someone mentions you in comments
							</p>
						</div>
						<Switch
							id="inapp-mentions"
							checked={notifications.inApp.mentions}
							onCheckedChange={(checked) =>
								setNotifications({
									...notifications,
									inApp: {
										...notifications.inApp,
										mentions: checked,
									},
								})
							}
						/>
					</div>

					<Separator />

					<div className="flex items-center justify-between">
						<div className="space-y-0.5">
							<Label htmlFor="inapp-tasks">Task Updates</Label>
							<p className="text-sm text-muted-foreground">
								Task assignments and status changes
							</p>
						</div>
						<Switch
							id="inapp-tasks"
							checked={notifications.inApp.tasks}
							onCheckedChange={(checked) =>
								setNotifications({
									...notifications,
									inApp: {
										...notifications.inApp,
										tasks: checked,
									},
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
