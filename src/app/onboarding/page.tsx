"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, Loader2, Sparkles, ArrowRight, Zap } from "lucide-react";
import Image from "next/image";

interface Integration {
	id: string;
	name: string;
	description: string;
	logo: string;
	authType: "oauth" | "api_key";
}

type OnboardingStep = "welcome" | "select" | "connect" | "sync" | "success";

const AVAILABLE_INTEGRATIONS: Integration[] = [
	{
		id: "github",
		name: "GitHub",
		description: "Track commits, PRs, and issues",
		logo: "/github-logo.png",
		authType: "oauth",
	},
	{
		id: "stripe",
		name: "Stripe",
		description: "Monitor revenue and subscriptions",
		logo: "/stripe-logo.png",
		authType: "api_key",
	},
	{
		id: "jira",
		name: "Jira",
		description: "Aggregate project tasks",
		logo: "/jira-logo.png",
		authType: "oauth",
	},
	{
		id: "linear",
		name: "Linear",
		description: "Track issues and sprints",
		logo: "/linear-logo.jpg",
		authType: "oauth",
	},
	{
		id: "sentry",
		name: "Sentry",
		description: "Monitor errors and performance",
		logo: "/sentry-logo.png",
		authType: "api_key",
	},
	{
		id: "slack",
		name: "Slack",
		description: "Get notifications and alerts",
		logo: "/slack-logo.png",
		authType: "oauth",
	},
];

export default function OnboardingPage() {
	const router = useRouter();
	const [step, setStep] = useState<OnboardingStep>("welcome");
	const [selectedIntegrations, setSelectedIntegrations] = useState<string[]>(
		[]
	);
	const [currentConnectingIndex, setCurrentConnectingIndex] = useState(0);
	const [connectedIntegrations, setConnectedIntegrations] = useState<
		string[]
	>([]);
	const [apiKeys, setApiKeys] = useState<Record<string, string>>({});
	const [isSyncing, setIsSyncing] = useState(false);
	const [syncProgress, setSyncProgress] = useState(0);

	// Load saved progress on mount
	useEffect(() => {
		loadProgress();
	}, []);

	// Save progress whenever step changes
	useEffect(() => {
		saveProgress();
	}, [step, selectedIntegrations, connectedIntegrations]);

	const loadProgress = async () => {
		try {
			const response = await fetch("/api/onboarding/progress");
			if (response.ok) {
				const data = await response.json();
				if (data.progress) {
					setStep(data.progress.step || "welcome");
					setSelectedIntegrations(
						data.progress.selectedIntegrations || []
					);
					setConnectedIntegrations(
						data.progress.connectedIntegrations || []
					);
				}
			}
		} catch (error) {
			console.error("[v0] Failed to load onboarding progress:", error);
		}
	};

	const saveProgress = async () => {
		try {
			await fetch("/api/onboarding/progress", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					step,
					selectedIntegrations,
					connectedIntegrations,
					completed: step === "success",
				}),
			});
		} catch (error) {
			console.error("[v0] Failed to save onboarding progress:", error);
		}
	};

	const handleToggleIntegration = (integrationId: string) => {
		setSelectedIntegrations((prev) =>
			prev.includes(integrationId)
				? prev.filter((id) => id !== integrationId)
				: [...prev, integrationId]
		);
	};

	const handleStartConnecting = () => {
		setStep("connect");
		setCurrentConnectingIndex(0);
	};

	const handleConnectIntegration = async (integration: Integration) => {
		if (integration.authType === "oauth") {
			// Redirect to OAuth flow
			window.location.href = `/api/integrations/${integration.id}/connect?onboarding=true`;
		} else {
			// Connect with API key
			const apiKey = apiKeys[integration.id];
			if (!apiKey) return;

			try {
				const response = await fetch(
					`/api/integrations/${integration.id}/connect`,
					{
						method: "POST",
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify({ apiKey }),
					}
				);

				if (response.ok) {
					setConnectedIntegrations((prev) => [
						...prev,
						integration.id,
					]);
					moveToNextIntegration();
				}
			} catch (error) {
				console.error("[v0] Failed to connect integration:", error);
			}
		}
	};

	const moveToNextIntegration = () => {
		const nextIndex = currentConnectingIndex + 1;
		if (nextIndex < selectedIntegrations.length) {
			setCurrentConnectingIndex(nextIndex);
		} else {
			// All integrations connected, start sync
			handleStartSync();
		}
	};

	const handleStartSync = async () => {
		setStep("sync");
		setIsSyncing(true);
		setSyncProgress(0);

		try {
			// Trigger initial sync for all connected integrations
			const response = await fetch("/api/onboarding/sync", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ integrationIds: connectedIntegrations }),
			});

			if (response.ok) {
				// Simulate progress
				const interval = setInterval(() => {
					setSyncProgress((prev) => {
						if (prev >= 100) {
							clearInterval(interval);
							setIsSyncing(false);
							setStep("success");
							return 100;
						}
						return prev + 10;
					});
				}, 500);
			}
		} catch (error) {
			console.error("[v0] Failed to start sync:", error);
			setIsSyncing(false);
		}
	};

	const handleSkipIntegration = () => {
		moveToNextIntegration();
	};

	const handleFinish = () => {
		router.push("/dashboard");
	};

	const currentIntegration =
		step === "connect" && selectedIntegrations[currentConnectingIndex]
			? AVAILABLE_INTEGRATIONS.find(
					(i) => i.id === selectedIntegrations[currentConnectingIndex]
				)
			: null;

	const connectProgress =
		selectedIntegrations.length > 0
			? (currentConnectingIndex / selectedIntegrations.length) * 100
			: 0;

	return (
		<div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
			<div className="w-full max-w-2xl">
				{/* Welcome Step */}
				{step === "welcome" && (
					<Card className="border-2">
						<CardHeader className="text-center space-y-2">
							<div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
								<Sparkles className="h-8 w-8 text-primary" />
							</div>
							<CardTitle className="text-3xl">
								Welcome to Founder&rsquo;s Stack
							</CardTitle>
							<CardDescription className="text-base">
								Your centralized dashboard for all your indie
								founder tools
							</CardDescription>
						</CardHeader>
						<CardContent className="space-y-6">
							<div className="space-y-4">
								<div className="flex items-start gap-3">
									<div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
										<Zap className="h-4 w-4 text-primary" />
									</div>
									<div>
										<h3 className="font-semibold">
											Aggregate All Your Data
										</h3>
										<p className="text-sm text-muted-foreground">
											Connect GitHub, Stripe, Jira, and
											more to see everything in one place
										</p>
									</div>
								</div>
								<div className="flex items-start gap-3">
									<div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
										<Zap className="h-4 w-4 text-primary" />
									</div>
									<div>
										<h3 className="font-semibold">
											Real-Time Insights
										</h3>
										<p className="text-sm text-muted-foreground">
											Track revenue, tasks, commits, and
											errors with live updates
										</p>
									</div>
								</div>
								<div className="flex items-start gap-3">
									<div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
										<Zap className="h-4 w-4 text-primary" />
									</div>
									<div>
										<h3 className="font-semibold">
											Smart Alerts
										</h3>
										<p className="text-sm text-muted-foreground">
											Get notified when metrics cross
											thresholds or anomalies are detected
										</p>
									</div>
								</div>
							</div>
						</CardContent>
						<CardFooter>
							<Button
								className="w-full"
								size="lg"
								onClick={() => setStep("select")}
							>
								Get Started
								<ArrowRight className="ml-2 h-4 w-4" />
							</Button>
						</CardFooter>
					</Card>
				)}

				{/* Integration Selection Step */}
				{step === "select" && (
					<Card className="border-2">
						<CardHeader>
							<CardTitle>Select Your Tools</CardTitle>
							<CardDescription>
								Choose the integrations you want to connect
							</CardDescription>
						</CardHeader>
						<CardContent>
							<div className="space-y-3">
								{AVAILABLE_INTEGRATIONS.map((integration) => (
									<div
										key={integration.id}
										className="flex items-center space-x-3 p-4 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors"
										onClick={() =>
											handleToggleIntegration(
												integration.id
											)
										}
									>
										<Checkbox
											checked={selectedIntegrations.includes(
												integration.id
											)}
											onCheckedChange={() =>
												handleToggleIntegration(
													integration.id
												)
											}
										/>
										<Image
											src={
												integration.logo ||
												"/placeholder.svg"
											}
											alt={integration.name}
											className="h-10 w-10 rounded"
										/>
										<div className="flex-1">
											<h4 className="font-semibold">
												{integration.name}
											</h4>
											<p className="text-sm text-muted-foreground">
												{integration.description}
											</p>
										</div>
									</div>
								))}
							</div>
						</CardContent>
						<CardFooter className="flex gap-2">
							<Button
								variant="outline"
								onClick={() => setStep("welcome")}
								className="flex-1"
							>
								Back
							</Button>
							<Button
								onClick={handleStartConnecting}
								disabled={selectedIntegrations.length === 0}
								className="flex-1"
							>
								Continue ({selectedIntegrations.length}{" "}
								selected)
							</Button>
						</CardFooter>
					</Card>
				)}

				{/* Connect Integrations Step */}
				{step === "connect" && currentIntegration && (
					<Card className="border-2">
						<CardHeader>
							<div className="space-y-4">
								<div className="flex items-center justify-between text-sm text-muted-foreground">
									<span>
										Step {currentConnectingIndex + 1} of{" "}
										{selectedIntegrations.length}
									</span>
									<span>
										{Math.round(connectProgress)}% complete
									</span>
								</div>
								<Progress
									value={connectProgress}
									className="h-2"
								/>
							</div>
							<div className="flex items-center gap-4 pt-4">
								<Image
									src={
										currentIntegration.logo ||
										"/placeholder.svg"
									}
									alt={currentIntegration.name}
									className="h-16 w-16 rounded-lg"
								/>
								<div>
									<CardTitle>
										Connect {currentIntegration.name}
									</CardTitle>
									<CardDescription>
										{currentIntegration.description}
									</CardDescription>
								</div>
							</div>
						</CardHeader>
						<CardContent>
							{currentIntegration.authType === "oauth" ? (
								<div className="space-y-4">
									<p className="text-sm text-muted-foreground">
										Click the button below to authorize
										Founder&rsquo;s Stack to access your{" "}
										{currentIntegration.name} data.
									</p>
									<Button
										className="w-full"
										onClick={() =>
											handleConnectIntegration(
												currentIntegration
											)
										}
									>
										Connect with {currentIntegration.name}
									</Button>
								</div>
							) : (
								<div className="space-y-4">
									<div className="space-y-2">
										<Label htmlFor="api-key">API Key</Label>
										<Input
											id="api-key"
											type="password"
											placeholder={`Enter your ${currentIntegration.name} API key`}
											value={
												apiKeys[
													currentIntegration.id
												] || ""
											}
											onChange={(e) =>
												setApiKeys((prev) => ({
													...prev,
													[currentIntegration.id]:
														e.target.value,
												}))
											}
										/>
									</div>
									<Button
										className="w-full"
										onClick={() =>
											handleConnectIntegration(
												currentIntegration
											)
										}
										disabled={
											!apiKeys[currentIntegration.id]
										}
									>
										Connect
									</Button>
								</div>
							)}
						</CardContent>
						<CardFooter>
							<Button
								variant="ghost"
								onClick={handleSkipIntegration}
								className="w-full"
							>
								Skip for now
							</Button>
						</CardFooter>
					</Card>
				)}

				{/* Sync Step */}
				{step === "sync" && (
					<Card className="border-2">
						<CardHeader className="text-center">
							<div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
								<Loader2 className="h-8 w-8 text-primary animate-spin" />
							</div>
							<CardTitle>Syncing Your Data</CardTitle>
							<CardDescription>
								This may take a few moments...
							</CardDescription>
						</CardHeader>
						<CardContent className="space-y-6">
							<Progress value={syncProgress} className="h-2" />
							<div className="space-y-2">
								{connectedIntegrations.map(
									(integrationId, index) => {
										const integration =
											AVAILABLE_INTEGRATIONS.find(
												(i) => i.id === integrationId
											);
										const isComplete =
											syncProgress >
											(index /
												connectedIntegrations.length) *
												100;
										return (
											<div
												key={integrationId}
												className="flex items-center gap-3 text-sm"
											>
												{isComplete ? (
													<CheckCircle2 className="h-5 w-5 text-green-500" />
												) : (
													<Loader2 className="h-5 w-5 text-muted-foreground animate-spin" />
												)}
												<span
													className={
														isComplete
															? "text-foreground"
															: "text-muted-foreground"
													}
												>
													Syncing {integration?.name}
													...
												</span>
											</div>
										);
									}
								)}
							</div>
						</CardContent>
					</Card>
				)}

				{/* Success Step */}
				{step === "success" && (
					<Card className="border-2">
						<CardHeader className="text-center space-y-2">
							<div className="mx-auto w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mb-4">
								<CheckCircle2 className="h-8 w-8 text-green-500" />
							</div>
							<CardTitle className="text-3xl">
								You&rsquo;re All Set!
							</CardTitle>
							<CardDescription className="text-base">
								Your dashboard is ready with data from{" "}
								{connectedIntegrations.length} integration
								{connectedIntegrations.length !== 1 ? "s" : ""}
							</CardDescription>
						</CardHeader>
						<CardContent>
							<div className="bg-muted rounded-lg p-4 space-y-2">
								<h4 className="font-semibold text-sm">
									Connected Integrations:
								</h4>
								<div className="flex flex-wrap gap-2">
									{connectedIntegrations.map(
										(integrationId) => {
											const integration =
												AVAILABLE_INTEGRATIONS.find(
													(i) =>
														i.id === integrationId
												);
											return (
												<div
													key={integrationId}
													className="flex items-center gap-2 bg-background rounded-md px-3 py-1.5"
												>
													<Image
														src={
															integration?.logo ||
															"/placeholder.svg"
														}
														alt={
															integration?.name ||
															""
														}
														className="h-5 w-5"
													/>
													<span className="text-sm font-medium">
														{integration?.name}
													</span>
												</div>
											);
										}
									)}
								</div>
							</div>
						</CardContent>
						<CardFooter>
							<Button
								className="w-full"
								size="lg"
								onClick={handleFinish}
							>
								Go to Dashboard
								<ArrowRight className="ml-2 h-4 w-4" />
							</Button>
						</CardFooter>
					</Card>
				)}
			</div>
		</div>
	);
}
