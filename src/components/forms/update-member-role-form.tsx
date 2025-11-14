"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "../ui/select";
import { DialogFooter } from "../ui/dialog";
import { updateMemberRole } from "@/server/members";
import { useOrganizationStore } from "@/zustand/providers/organization-store-provider";
import { getUser } from "@/server/users";
import { MemberUser } from "@/types";

const formSchema = z.object({
	email: z.string().email(),
	role: z.enum(["owner", "admin", "member", "viewer", "guest"]),
});

export function UpdateMemberRoleForm({
	defaultValues,
	memberId,
	onSuccess,
}: {
	defaultValues: z.infer<typeof formSchema>;
	memberId: string;
	onSuccess: () => void;
}) {
	const {
		activeOrganization: organization,
		isAdmin,
		isOwner,
		updateMember,
	} = useOrganizationStore((state) => state);
	const [isLoading, setIsLoading] = useState(false);

	const form = useForm<z.infer<typeof formSchema>>({
		resolver: zodResolver(formSchema),
		defaultValues,
	});

	async function onSubmit(values: z.infer<typeof formSchema>) {
		try {
			toast.loading("Updating role...");
			setIsLoading(true);

			if (!organization) return;

			// Only Owners can assign or change the Owner role
			if (values.role === "owner" && !isOwner) {
				toast.dismiss();
				toast.error("Only Owners can assign the Owner role");
				return;
			}

			// Admins and Owners can change other roles
			if (!isAdmin && !isOwner) {
				toast.dismiss();
				toast.error("You do not have permission to change member role");
				return;
			}

			const { data, success, error } = await updateMemberRole(
				memberId,
				organization.id,
				values.role
			);

			if (!success) {
				console.error("Error:", error);
				toast.dismiss();
				toast.error("Failed to update member role");
				return;
			}

			toast.dismiss();
			toast.success("Member role updated successfully");
			onSuccess();

			if (data) {
				const updatedMemberUser = await getUser(data.userId);

				if (!updatedMemberUser.data) return;

				updateMember({
					...data,
					user: updatedMemberUser?.data as MemberUser,
				});
			}
		} catch (error) {
			console.error(error);
			toast.dismiss();
			toast.error("Failed to update member role");
		} finally {
			setIsLoading(false);
		}
	}

	return (
		<Form {...form}>
			<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
				<FormField
					control={form.control}
					name="email"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Email</FormLabel>
							<FormControl>
								<Input
									placeholder="example@mail.com"
									{...field}
									disabled
								/>
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>

				<FormField
					control={form.control}
					name="role"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Role</FormLabel>
							<Select
								onValueChange={field.onChange}
								defaultValue={field.value}
							>
								<FormControl>
									<SelectTrigger>
										<SelectValue placeholder="Select a role" />
									</SelectTrigger>
								</FormControl>
								<SelectContent>
									<SelectItem value="owner">Owner</SelectItem>
									<SelectItem value="admin">Admin</SelectItem>
									<SelectItem value="member">
										Member
									</SelectItem>
									<SelectItem value="viewer">
										Viewer
									</SelectItem>
									<SelectItem value="guest">Guest</SelectItem>
								</SelectContent>
							</Select>
							<FormMessage />
						</FormItem>
					)}
				/>
				<DialogFooter>
					<Button disabled={isLoading} type="submit">
						Update Role
						{isLoading && (
							<Loader2 className="size-4 animate-spin" />
						)}
					</Button>
				</DialogFooter>
			</form>
		</Form>
	);
}
