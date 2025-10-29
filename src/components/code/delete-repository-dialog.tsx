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
import { Repository } from "@/types/code";
import { useCodeStore } from "@/zustand/providers/code-store-provider";

interface DeleteRepositoryDialogProps {
	repository: Repository;
	disabled?: boolean;
}

export function DeleteRepositoryDialog({
	repository,
}: DeleteRepositoryDialogProps) {
	const deleteRepository = useCodeStore((state) => state.deleteRepository);

	const [open, setOpen] = useState(false);
	const [isDeleting, setIsDeleting] = useState(false);

	const handleDelete = async () => {
		setIsDeleting(true);
		try {
			await deleteRepository(repository.id);
			toast.success("Repository deleted successfully");
			setOpen(false);
		} catch (error) {
			console.error("[DELETE_REPOSITORY]", error);
			toast.error("Failed to delete repository");
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
					<AlertDialogTitle>Delete Repository</AlertDialogTitle>
					<AlertDialogDescription>
						Are you sure you want to delete{" "}
						<strong>{repository.name}</strong>? This will remove all
						associated data including commits, pull requests,
						issues, and branches. This action cannot be undone.
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
								Delete Repository
							</>
						)}
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}
