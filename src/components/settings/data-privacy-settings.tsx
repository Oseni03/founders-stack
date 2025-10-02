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
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Download, Trash2, Shield, Loader2 } from "lucide-react";
import { toast } from "sonner";

export function DataPrivacySettings() {
	const [isExporting, setIsExporting] = useState(false);
	const [privacy, setPrivacy] = useState({
		analytics: true,
		thirdPartySharing: false,
		marketingEmails: true,
	});

	const handleExportData = async () => {
		setIsExporting(true);
		try {
			const response = await fetch("/api/settings/export-data", {
				method: "POST",
			});

			if (response.ok) {
				const blob = await response.blob();
				const url = window.URL.createObjectURL(blob);
				const a = document.createElement("a");
				a.href = url;
				a.download = `founders-stack-data-${new Date().toISOString().split("T")[0]}.json`;
				document.body.appendChild(a);
				a.click();
				window.URL.revokeObjectURL(url);
				document.body.removeChild(a);

				toast.success("Data exported", {
					description: "Your data has been downloaded successfully.",
				});
			} else {
				throw new Error("Export failed");
			}
		} catch (error) {
			console.error("Data export error:", error);
			toast.error("Error", {
				description: "Failed to export data. Please try again.",
			});
		} finally {
			setIsExporting(false);
		}
	};

	const handleDeleteAccount = async () => {
		try {
			const response = await fetch("/api/settings/delete-account", {
				method: "DELETE",
			});

			if (response.ok) {
				toast.info("Account deleted", {
					description: "Your account has been permanently deleted.",
				});
				// Redirect to login or home page
				window.location.href = "/";
			} else {
				throw new Error("Deletion failed");
			}
		} catch (error) {
			console.log("Account deletion error:", error);
			toast.error("Error", {
				description:
					"Failed to delete account. Please contact support.",
			});
		}
	};

	return (
		<div className="space-y-6">
			<Card>
				<CardHeader>
					<CardTitle>Privacy Settings</CardTitle>
					<CardDescription>
						Control how your data is used and shared
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="flex items-center justify-between">
						<div className="space-y-0.5">
							<Label htmlFor="analytics">Usage Analytics</Label>
							<p className="text-sm text-muted-foreground">
								Help us improve by sharing anonymous usage data
							</p>
						</div>
						<Switch
							id="analytics"
							checked={privacy.analytics}
							onCheckedChange={(checked) =>
								setPrivacy({ ...privacy, analytics: checked })
							}
						/>
					</div>

					<Separator />

					<div className="flex items-center justify-between">
						<div className="space-y-0.5">
							<Label htmlFor="third-party">
								Third-Party Data Sharing
							</Label>
							<p className="text-sm text-muted-foreground">
								Allow sharing data with integrated services
							</p>
						</div>
						<Switch
							id="third-party"
							checked={privacy.thirdPartySharing}
							onCheckedChange={(checked) =>
								setPrivacy({
									...privacy,
									thirdPartySharing: checked,
								})
							}
						/>
					</div>

					<Separator />

					<div className="flex items-center justify-between">
						<div className="space-y-0.5">
							<Label htmlFor="marketing">Marketing Emails</Label>
							<p className="text-sm text-muted-foreground">
								Receive product updates and tips
							</p>
						</div>
						<Switch
							id="marketing"
							checked={privacy.marketingEmails}
							onCheckedChange={(checked) =>
								setPrivacy({
									...privacy,
									marketingEmails: checked,
								})
							}
						/>
					</div>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>Data Management</CardTitle>
					<CardDescription>
						Export or delete your data
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="flex items-start gap-4 p-4 border rounded-lg">
						<div className="p-2 rounded-lg bg-muted">
							<Download className="h-5 w-5" />
						</div>
						<div className="flex-1">
							<h4 className="font-medium mb-1">
								Export Your Data
							</h4>
							<p className="text-sm text-muted-foreground mb-3">
								Download a copy of all your data in JSON format.
								This includes tasks, transactions, commits, and
								all other CDM entities.
							</p>
							<Button
								onClick={handleExportData}
								disabled={isExporting}
								variant="outline"
								className="gap-2 bg-transparent"
							>
								{isExporting && (
									<Loader2 className="h-4 w-4 animate-spin" />
								)}
								<Download className="h-4 w-4" />
								Export Data
							</Button>
						</div>
					</div>

					<div className="flex items-start gap-4 p-4 border border-destructive/50 rounded-lg">
						<div className="p-2 rounded-lg bg-destructive/10">
							<Trash2 className="h-5 w-5 text-destructive" />
						</div>
						<div className="flex-1">
							<h4 className="font-medium mb-1 text-destructive">
								Delete Account
							</h4>
							<p className="text-sm text-muted-foreground mb-3">
								Permanently delete your account and all
								associated data. This action cannot be undone.
							</p>
							<AlertDialog>
								<AlertDialogTrigger asChild>
									<Button
										variant="destructive"
										className="gap-2"
									>
										<Trash2 className="h-4 w-4" />
										Delete Account
									</Button>
								</AlertDialogTrigger>
								<AlertDialogContent>
									<AlertDialogHeader>
										<AlertDialogTitle>
											Are you absolutely sure?
										</AlertDialogTitle>
										<AlertDialogDescription>
											This action cannot be undone. This
											will permanently delete your account
											and remove all your data from our
											servers, including:
											<ul className="list-disc list-inside mt-2 space-y-1">
												<li>All tasks and projects</li>
												<li>Transaction history</li>
												<li>
													Code commits and analytics
												</li>
												<li>Integration connections</li>
												<li>API keys and settings</li>
											</ul>
										</AlertDialogDescription>
									</AlertDialogHeader>
									<AlertDialogFooter>
										<AlertDialogCancel>
											Cancel
										</AlertDialogCancel>
										<AlertDialogAction
											onClick={handleDeleteAccount}
											className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
										>
											Yes, delete my account
										</AlertDialogAction>
									</AlertDialogFooter>
								</AlertDialogContent>
							</AlertDialog>
						</div>
					</div>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>Security</CardTitle>
					<CardDescription>
						Manage your account security
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="flex items-start gap-4 p-4 border rounded-lg">
						<div className="p-2 rounded-lg bg-muted">
							<Shield className="h-5 w-5" />
						</div>
						<div className="flex-1">
							<h4 className="font-medium mb-1">
								Two-Factor Authentication
							</h4>
							<p className="text-sm text-muted-foreground mb-3">
								Add an extra layer of security to your account
								with 2FA
							</p>
							<Button variant="outline">Enable 2FA</Button>
						</div>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
