"use client";

import React, { useState } from "react";
import { Building2, Edit, Loader2, Trash2 } from "lucide-react";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { UpdateOrganizationForm } from "../forms/update-organization-form";
import { toast } from "sonner";
import { Organization } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { deleteOrganization } from "@/server/organizations";

const ProjectCard = ({
	organization,
	isAdmin,
	removeOrganization,
}: {
	organization: Organization;
	isAdmin: boolean;
	removeOrganization: (organizationId: string) => Promise<void>;
}) => {
	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
	const [updateDialogOpen, setUpdateDialogOpen] = useState(false);
	const [isDeleting, setIsDeleting] = useState(false);

	const handleDeleteConfirm = async () => {
		try {
			toast.loading("Deleting project...");
			setIsDeleting(true);

			if (!organization) return;

			const { data, success } = await deleteOrganization(organization.id);

			if (!success) {
				toast.dismiss();
				toast.error("Failed to delete project");
				return;
			}

			if (data) {
				removeOrganization(data.id);
				toast.dismiss();
				toast.success("Project deleted successfully");
			}
		} catch (error) {
			console.error(error);
			toast.dismiss();
			toast.error("Failed to delete project");
		} finally {
			setIsDeleting(false);
			setDeleteDialogOpen(false);
		}
	};
	return (
		<div className="space-y-6">
			{/* Project Information Card */}
			<Card>
				<CardHeader className="border-b">
					<div className="flex items-center justify-between">
						<CardTitle className="flex items-center gap-2">
							<Building2 className="w-6 h-6" />
							Project Information
						</CardTitle>
						{isAdmin && (
							<div className="flex items-center gap-2">
								<Button
									variant="ghost"
									size="sm"
									onClick={() => setUpdateDialogOpen(true)}
									className="h-9 w-9 p-0"
								>
									<Edit className="w-5 h-5" />
								</Button>

								<Button
									variant="ghost"
									size="sm"
									className="h-9 w-9 p-0 hover:bg-red-50 hover:text-red-600"
									onClick={() => setDeleteDialogOpen(true)}
								>
									<Trash2 className="w-5 h-5" />
								</Button>
							</div>
						)}
					</div>
				</CardHeader>
				<CardContent className="p-4 sm:p-6 space-y-4">
					<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
						<div className="space-y-1">
							<label className="text-sm font-medium text-muted-foreground">
								Name
							</label>
							<div className="text-base sm:text-lg font-medium break-words">
								{organization.name}
							</div>
						</div>
						<div className="space-y-1">
							<label className="text-sm font-medium text-muted-foreground">
								Created
							</label>
							<div className="text-base sm:text-lg font-medium">
								{format(organization.createdAt, "MMMM d, yyyy")}
							</div>
						</div>
					</div>
					<div className="space-y-1">
						<label className="text-sm font-medium text-muted-foreground">
							Description
						</label>
						<div className="text-base break-words">
							{organization.description ||
								"No description provided"}
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Update Project Dialog */}
			<Dialog open={updateDialogOpen} onOpenChange={setUpdateDialogOpen}>
				<DialogContent showCloseButton={true}>
					<DialogHeader>
						<DialogTitle>Update Project</DialogTitle>
						<DialogDescription>
							Make changes to your project information here. Click
							save when you&rsquo;re done.
						</DialogDescription>
					</DialogHeader>
					<UpdateOrganizationForm
						organization={organization as Organization}
					/>
				</DialogContent>
			</Dialog>

			{/* Delete Project Alert Dialog */}
			<AlertDialog
				open={deleteDialogOpen}
				onOpenChange={setDeleteDialogOpen}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>
							Are you absolutely sure?
						</AlertDialogTitle>
						<AlertDialogDescription>
							This action cannot be undone. This will permanently
							delete the project{" "}
							<strong>{organization?.name}</strong> and remove all
							associated data from our servers.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancel</AlertDialogCancel>
						<AlertDialogAction
							onClick={handleDeleteConfirm}
							className="bg-red-600 hover:bg-red-700"
						>
							Delete Project
							{isDeleting && (
								<Loader2 className="size-4 animate-spin ml-2" />
							)}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
};

export default ProjectCard;
