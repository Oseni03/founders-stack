import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface DeleteTaskDialogProps {
	open: boolean;
	onClose: () => void;
	onConfirm: () => Promise<void>;
	loading: boolean;
}

export function DeleteTaskDialog({
	open,
	onClose,
	onConfirm,
	loading,
}: DeleteTaskDialogProps) {
	return (
		<Dialog open={open} onOpenChange={onClose}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Delete Task</DialogTitle>
					<DialogDescription>
						Are you sure you want to delete this task? This will
						only remove it locally. The task will remain in the
						source platform.
					</DialogDescription>
				</DialogHeader>
				<DialogFooter>
					<Button
						type="button"
						variant="outline"
						onClick={onClose}
						disabled={loading}
					>
						Cancel
					</Button>
					<Button
						type="button"
						variant="destructive"
						onClick={onConfirm}
						disabled={loading}
					>
						{loading && (
							<Loader2 className="mr-2 h-4 w-4 animate-spin" />
						)}
						Delete
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
