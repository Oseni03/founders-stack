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
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useOrganizationStore } from "@/zustand/providers/organization-store-provider";
import { deleteIntegration } from "@/server/integrations";

interface DisconnectButtonProps {
	integrationId: string | null | undefined;
	integrationName: string;
	onDisconnect?: () => Promise<void>;
}

export function DisconnectButton({
	integrationId,
	integrationName,
	onDisconnect,
}: DisconnectButtonProps) {
	const organizationId = useOrganizationStore(
		(state) => state.activeOrganization?.id
	);
	const [isOpen, setIsOpen] = useState(false);
	const [isLoading, setIsLoading] = useState(false);

	const handleDisconnect = async () => {
		setIsLoading(true);
		if (!organizationId || !integrationId) {
			toast.error("Project or Integration ID is missing.");
			setIsLoading(false);
			return;
		}

		try {
			await deleteIntegration(organizationId!, integrationId!);

			toast.success(`${integrationName} disconnected successfully`);
			setIsOpen(false);

			// Call the optional callback to refresh data
			onDisconnect?.();
		} catch (error) {
			console.error("Error disconnecting integration:", error);
			toast.error("Failed to disconnect integration. Please try again.");
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<AlertDialog open={isOpen} onOpenChange={setIsOpen}>
			<AlertDialogTrigger asChild>
				<Button
					variant="destructive"
					size="sm"
					disabled={!integrationId}
				>
					Disconnect
				</Button>
			</AlertDialogTrigger>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>
						Disconnect {integrationName}?
					</AlertDialogTitle>
					<AlertDialogDescription>
						This will disconnect {integrationName} from your
						project. You will no longer receive synced data from
						this integration. You can reconnect at any time.
					</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel disabled={isLoading}>
						Cancel
					</AlertDialogCancel>
					<AlertDialogAction
						onClick={handleDisconnect}
						disabled={isLoading}
						className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
					>
						{isLoading ? (
							<>
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
								Disconnecting...
							</>
						) : (
							"Disconnect"
						)}
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}
