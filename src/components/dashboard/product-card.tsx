"use client";

import React from "react";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "../ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Badge } from "../ui/badge";
import { Organization } from "@/types";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "../ui/alert-dialog";
import { Button } from "../ui/button";
import { MoreHorizontal, Eye, Edit, Trash2, Loader2 } from "lucide-react";
import { useOrganizationStore } from "@/zustand/providers/organization-store-provider";
import { deleteOrganization } from "@/server/organizations";
import { toast } from "sonner";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "../ui/dialog";
import { UpdateOrganizationForm } from "../forms/update-organization-form";
import Link from "next/link";

export function ProductCard({ product }: { product: Organization }) {
	const removeProduct = useOrganizationStore(
		(state) => state.removeOrganization
	);
	const [isDeleteLoading, setIsDeleteLoading] = React.useState(false);
	const [isEditOpen, setIsEditOpen] = React.useState(false);
	const [isDeleteOpen, setIsDeleteOpen] = React.useState(false);

	const handleDelete = async () => {
		try {
			toast.loading("Deleting product...");
			setIsDeleteLoading(true);
			const { success, error } = await deleteOrganization(product.id);
			if (success) {
				removeProduct(product.id);
				toast.dismiss();
				toast.success("Product deleted successfully");
				setIsDeleteOpen(false);
			} else {
				toast.dismiss();
				toast.error(
					(error as Error).message || "Failed to delete product"
				);
			}
		} catch (error) {
			console.error(error);
			toast.dismiss();
			toast.error("Failed to delete product");
		} finally {
			setIsDeleteLoading(false);
		}
	};

	return (
		<Card className="hover-scale group cursor-pointer relative">
			<div className="absolute top-2 right-2">
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button
							variant="ghost"
							size="sm"
							className="h-8 w-8 p-0"
						>
							<MoreHorizontal className="h-4 w-4" />
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent align="end">
						<DropdownMenuItem asChild>
							<Link href={`/products/${product.id}`}>
								<Eye className="mr-2 h-4 w-4" />
								View Dashboard
							</Link>
						</DropdownMenuItem>
						<DropdownMenuItem onSelect={() => setIsEditOpen(true)}>
							<Edit className="mr-2 h-4 w-4" />
							Edit
						</DropdownMenuItem>
						<DropdownMenuItem
							onSelect={() => setIsDeleteOpen(true)}
							disabled={isDeleteLoading}
						>
							<Trash2 className="mr-2 h-4 w-4" />
							Delete
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			</div>
			<CardHeader className="pb-3">
				<div className="flex items-start gap-3">
					<div className="flex-shrink-0">
						<Avatar className="h-12 w-12 rounded-lg">
							<AvatarImage
								src={
									product.logo ||
									`https://api.dicebear.com/7.x/shapes/svg?seed=${product.name}`
								}
							/>
							<AvatarFallback className="rounded-lg bg-primary/10 text-primary font-bold">
								{product.name.substring(0, 2).toUpperCase()}
							</AvatarFallback>
						</Avatar>
					</div>
					<div className="flex-1 min-w-0">
						<CardTitle className="text-base sm:text-lg mb-1 truncate">
							{product.name}
						</CardTitle>
						<CardDescription className="text-xs line-clamp-2">
							{product.description || "No description available"}
						</CardDescription>
					</div>
				</div>
			</CardHeader>
			<CardContent className="space-y-3">
				<div>
					<p className="text-xs text-muted-foreground mb-1">
						Active Tasks
					</p>
					<p className="text-xl sm:text-2xl font-bold">
						{product.activeTasks || 0}
					</p>
				</div>
				<div className="flex items-center justify-between text-sm">
					<span className="text-muted-foreground">
						Connected Tools
					</span>
					<Badge variant="secondary">{product.toolCount || 0}</Badge>
				</div>
			</CardContent>
			<Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
				<DialogContent showCloseButton={true}>
					<DialogHeader>
						<DialogTitle>Edit Product</DialogTitle>
						<DialogDescription>
							Update the details of your product.
						</DialogDescription>
					</DialogHeader>
					<UpdateOrganizationForm organization={product} />
				</DialogContent>
			</Dialog>
			<AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Delete Product</AlertDialogTitle>
						<AlertDialogDescription>
							{`Are you sure you want to delete ${product.name}? This action cannot be undone.`}
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancel</AlertDialogCancel>
						<AlertDialogAction
							onClick={handleDelete}
							disabled={isDeleteLoading}
							className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
						>
							Delete
							{isDeleteLoading && (
								<Loader2 className="ml-2 h-4 w-4 animate-spin" />
							)}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</Card>
	);
}
