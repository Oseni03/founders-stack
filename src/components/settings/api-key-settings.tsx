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
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Copy, Eye, EyeOff, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface ApiKey {
	id: string;
	name: string;
	key: string;
	created: string;
	lastUsed?: string;
}

export function ApiKeySettings() {
	const [apiKeys, setApiKeys] = useState<ApiKey[]>([
		{
			id: "1",
			name: "Production API",
			key: "fsk_live_1234567890abcdef",
			created: "2024-01-15",
			lastUsed: "2 hours ago",
		},
		{
			id: "2",
			name: "Development API",
			key: "fsk_test_abcdef1234567890",
			created: "2024-01-10",
			lastUsed: "5 minutes ago",
		},
	]);
	const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
	const [newKeyName, setNewKeyName] = useState("");

	const handleCopy = (key: string) => {
		navigator.clipboard.writeText(key);
		toast.info("Copied to clipboard", {
			description: "API key has been copied to your clipboard.",
		});
	};

	const handleToggleVisibility = (id: string) => {
		setShowKeys({ ...showKeys, [id]: !showKeys[id] });
	};

	const handleCreateKey = async () => {
		if (!newKeyName.trim()) {
			toast.error("Error", {
				description: "Please enter a name for the API key.",
			});
			return;
		}

		const newKey: ApiKey = {
			id: Date.now().toString(),
			name: newKeyName,
			key: `fsk_${Math.random().toString(36).substring(2, 15)}`,
			created: new Date().toISOString().split("T")[0],
		};

		setApiKeys([...apiKeys, newKey]);
		setNewKeyName("");
		toast.success("API key created", {
			description:
				"Your new API key has been generated. Make sure to copy it now.",
		});
	};

	const handleDeleteKey = (id: string) => {
		setApiKeys(apiKeys.filter((key) => key.id !== id));
		toast.info("API key deleted", {
			description: "The API key has been permanently deleted.",
		});
	};

	return (
		<div className="space-y-6">
			<Card>
				<CardHeader>
					<CardTitle>API Keys</CardTitle>
					<CardDescription>
						Manage API keys for programmatic access to your data
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-6">
					<div className="space-y-4">
						<div className="flex gap-2">
							<div className="flex-1">
								<Input
									placeholder="API key name (e.g., Production API)"
									value={newKeyName}
									onChange={(e) =>
										setNewKeyName(e.target.value)
									}
								/>
							</div>
							<Button onClick={handleCreateKey} className="gap-2">
								<Plus className="h-4 w-4" />
								Create Key
							</Button>
						</div>

						<div className="space-y-3">
							{apiKeys.map((apiKey) => (
								<div
									key={apiKey.id}
									className="flex items-center gap-3 p-4 border rounded-lg"
								>
									<div className="flex-1 min-w-0">
										<div className="flex items-center gap-2 mb-1">
											<h4 className="font-medium">
												{apiKey.name}
											</h4>
											<Badge
												variant="outline"
												className="text-xs"
											>
												{apiKey.key.startsWith(
													"fsk_live"
												)
													? "Live"
													: "Test"}
											</Badge>
										</div>
										<div className="flex items-center gap-2 mb-1">
											<code className="text-sm font-mono bg-muted px-2 py-1 rounded">
												{showKeys[apiKey.id]
													? apiKey.key
													: "••••••••••••••••"}
											</code>
											<Button
												variant="ghost"
												size="icon"
												className="h-6 w-6"
												onClick={() =>
													handleToggleVisibility(
														apiKey.id
													)
												}
											>
												{showKeys[apiKey.id] ? (
													<EyeOff className="h-3 w-3" />
												) : (
													<Eye className="h-3 w-3" />
												)}
											</Button>
											<Button
												variant="ghost"
												size="icon"
												className="h-6 w-6"
												onClick={() =>
													handleCopy(apiKey.key)
												}
											>
												<Copy className="h-3 w-3" />
											</Button>
										</div>
										<div className="flex gap-4 text-xs text-muted-foreground">
											<span>
												Created: {apiKey.created}
											</span>
											{apiKey.lastUsed && (
												<span>
													Last used: {apiKey.lastUsed}
												</span>
											)}
										</div>
									</div>
									<Button
										variant="ghost"
										size="icon"
										onClick={() =>
											handleDeleteKey(apiKey.id)
										}
									>
										<Trash2 className="h-4 w-4 text-destructive" />
									</Button>
								</div>
							))}
						</div>
					</div>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>API Documentation</CardTitle>
					<CardDescription>
						Learn how to use the Founder&rsquo;s Stack API
					</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="space-y-4">
						<div>
							<h4 className="font-medium mb-2">Authentication</h4>
							<p className="text-sm text-muted-foreground mb-2">
								Include your API key in the Authorization
								header:
							</p>
							<code className="block text-sm bg-muted p-3 rounded-lg font-mono">
								Authorization: Bearer YOUR_API_KEY
							</code>
						</div>

						<div>
							<h4 className="font-medium mb-2">Base URL</h4>
							<code className="block text-sm bg-muted p-3 rounded-lg font-mono">
								https://api.foundersstack.com/v1
							</code>
						</div>

						<Button
							variant="outline"
							className="w-full bg-transparent"
						>
							View Full Documentation
						</Button>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
