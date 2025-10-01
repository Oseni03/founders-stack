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
	email: z.email(),
	role: z.enum(["admin", "member"]),
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
		updateMember,
	} = useOrganizationStore((state) => state);
	const [isLoading, setIsLoading] = useState(false);

	const form = useForm<z.infer<typeof formSchema>>({
		resolver: zodResolver(formSchema),
		defaultValues,
	});

	async function onSubmit(values: z.infer<typeof formSchema>) {
		try {
			toast.loading("Sending invite...");
			setIsLoading(true);

			if (!organization) return;

			if (!isAdmin) {
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
			toast.error("Member role updated successfully");
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
										<SelectValue placeholder="Select a verified email to display" />
									</SelectTrigger>
								</FormControl>
								<SelectContent>
									<SelectItem value="member">
										Member
									</SelectItem>
									<SelectItem value="admin">Admin</SelectItem>
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
