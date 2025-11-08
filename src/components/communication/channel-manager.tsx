"use client";

import { useMemo } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useIntegrationsStore } from "@/zustand/providers/integrations-store-provider";
import { useRouter } from "next/navigation";
import { Channel } from "@/types/communication";
import { DeleteChannelDialog } from "./delete-channel-dialog";

interface ChannelManagerProps {
	productId: string;
	channels: Channel[];
	selectedChannelId: string;
	onSelectChannel: (channelId: string) => void;
}

export function ChannelManager({
	productId,
	channels,
	selectedChannelId,
	onSelectChannel,
}: ChannelManagerProps) {
	const integrations = useIntegrationsStore((state) => state.integrations);
	const router = useRouter();

	const communicationIntegrations = useMemo(() => {
		return integrations.filter((item) => item.category === "COMMUNICATION");
	}, [integrations]);

	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between">
				<h3 className="font-semibold text-foreground">Channels</h3>
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button size="sm" variant="outline" className="gap-2">
							<Plus className="h-4 w-4" />
							Add
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent>
						{communicationIntegrations.map((integration) => (
							<DropdownMenuItem
								key={integration.id}
								onClick={() =>
									router.push(
										`/products/${productId}/integrations/${integration.toolName}/onboarding`
									)
								}
							>
								<span>{integration.toolName}</span>
							</DropdownMenuItem>
						))}
					</DropdownMenuContent>
				</DropdownMenu>
			</div>

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
						<Button
							onClick={() => onSelectChannel(channel.id)}
							className="flex-1 text-left"
						>
							#{channel.name}
						</Button>
						<DeleteChannelDialog
							productId={productId}
							channel={channel}
						/>
					</div>
				))}
			</div>
		</div>
	);
}
