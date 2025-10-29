"use client";

import { useState } from "react";
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
import { Button } from "@/components/ui/button";
import { Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useCommunicationStore } from "@/zustand/providers/communication-store-provider";
import { Channel } from "@/types/communication";

interface DeleteChannelDialogProps {
	channel: Channel;
	disabled?: boolean;
}

export function DeleteChannelDialog({ channel }: DeleteChannelDialogProps) {
	const removeChannel = useCommunicationStore((state) => state.removeChannel);

	const [open, setOpen] = useState(false);
	const [isDeleting, setIsDeleting] = useState(false);

	const handleDelete = async () => {
		setIsDeleting(true);
		try {
			const response = await fetch("/api/communication", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					action: "deleteChannel",
					data: { channelId: channel.id },
				}),
			});

			if (!response.ok) throw new Error("Failed to delete channel");

			toast.success("Channel deleted successfully");
			removeChannel(channel.id);
			setOpen(false);
		} catch (err) {
			console.error("[Communication] Delete channel error:", err);
			toast.error("Failed to delete channel");
		} finally {
			setIsDeleting(false);
		}
	};

	return (
		<AlertDialog open={open} onOpenChange={setOpen}>
			<AlertDialogTrigger asChild>
				<Button size="sm" variant="ghost" className="h-8 w-8 p-0">
					<Trash2 className="h-4 w-4 text-destructive" />
				</Button>
			</AlertDialogTrigger>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>Delete Channel</AlertDialogTitle>
					<AlertDialogDescription>
						Are you sure you want to delete{" "}
						<strong>{channel.name}</strong>? This will remove all
						associated data including messages. This action cannot
						be undone.
					</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel disabled={isDeleting}>
						Cancel
					</AlertDialogCancel>
					<AlertDialogAction
						onClick={handleDelete}
						disabled={isDeleting}
						className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
					>
						{isDeleting ? (
							<>
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
								Deleting...
							</>
						) : (
							<>
								<Trash2 className="mr-2 h-4 w-4" />
								Delete Channel
							</>
						)}
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}
