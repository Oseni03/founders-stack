"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";

interface Channel {
	id: string;
	name: string;
	description: string;
}

interface ChannelManagerProps {
	channels: Channel[];
	selectedChannelId: string;
	onSelectChannel: (channelId: string) => void;
	onAddChannel: (name: string, description: string) => void;
	onDeleteChannel: (channelId: string) => void;
}

export function ChannelManager({
	channels,
	selectedChannelId,
	onSelectChannel,
	onAddChannel,
	onDeleteChannel,
}: ChannelManagerProps) {
	const [isAddingChannel, setIsAddingChannel] = useState(false);
	const [newChannelName, setNewChannelName] = useState("");
	const [newChannelDescription, setNewChannelDescription] = useState("");

	const handleAddChannel = () => {
		if (newChannelName.trim()) {
			onAddChannel(newChannelName, newChannelDescription);
			setNewChannelName("");
			setNewChannelDescription("");
			setIsAddingChannel(false);
		}
	};

	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between">
				<h3 className="font-semibold text-foreground">Channels</h3>
				<Button
					size="sm"
					variant="outline"
					onClick={() => setIsAddingChannel(!isAddingChannel)}
					className="gap-2"
				>
					<Plus className="h-4 w-4" />
					Add
				</Button>
			</div>

			{isAddingChannel && (
				<Card className="p-4">
					<div className="space-y-3">
						<Input
							placeholder="Channel name"
							value={newChannelName}
							onChange={(e) => setNewChannelName(e.target.value)}
							className="text-sm"
						/>
						<Input
							placeholder="Description (optional)"
							value={newChannelDescription}
							onChange={(e) =>
								setNewChannelDescription(e.target.value)
							}
							className="text-sm"
						/>
						<div className="flex gap-2">
							<Button
								size="sm"
								onClick={handleAddChannel}
								className="flex-1"
							>
								Create
							</Button>
							<Button
								size="sm"
								variant="outline"
								onClick={() => setIsAddingChannel(false)}
								className="flex-1"
							>
								Cancel
							</Button>
						</div>
					</div>
				</Card>
			)}

			<div className="space-y-2">
				{channels.map((channel) => (
					<div
						key={channel.id}
						className={`flex items-center justify-between rounded-lg border p-3 transition-colors ${
							selectedChannelId === channel.id
								? "border-primary bg-primary/5"
								: "border-border hover:bg-muted/50"
						}`}
					>
						<button
							onClick={() => onSelectChannel(channel.id)}
							className="flex-1 text-left"
						>
							<p className="font-medium text-foreground">
								#{channel.name}
							</p>
							<p className="text-xs text-muted-foreground">
								{channel.description}
							</p>
						</button>
						<Button
							size="sm"
							variant="ghost"
							onClick={() => onDeleteChannel(channel.id)}
							className="h-8 w-8 p-0"
						>
							<Trash2 className="h-4 w-4 text-destructive" />
						</Button>
					</div>
				))}
			</div>
		</div>
	);
}
