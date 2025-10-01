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
import { authClient } from "@/lib/auth-client";
import { useOrganizationStore } from "@/zustand/providers/organization-store-provider";
import { Invitation } from "better-auth/plugins";

const formSchema = z.object({
	email: z.email(),
	role: z.enum(["admin", "member"]),
});

export function InvitationForm({ onSuccess }: { onSuccess: () => void }) {
	const [isLoading, setIsLoading] = useState(false);
	const { addInvitation, activeOrganization: organization } =
		useOrganizationStore((state) => state);

	const form = useForm<z.infer<typeof formSchema>>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			email: "",
			role: "member",
		},
	});

	async function onSubmit(values: z.infer<typeof formSchema>) {
		try {
			toast.loading("Sending invite...");
			setIsLoading(true);

			if (!organization) return;

			const { error, data } = await authClient.organization.inviteMember({
				email: values.email,
				role: values.role,
				organizationId: organization.id,
				resend: true,
			});

			if (error) {
				console.error("Error creating invite: ", error);
				toast.dismiss();
				toast.error(error.message || "Failed to create invitation");
			} else {
				toast.dismiss();
				toast.success(
					`Invitation created successfully. Check your email`
				);
				onSuccess();
			}

			if (data) {
				addInvitation(data as Invitation);
			}
		} catch (error) {
			console.error(error);
			toast.dismiss();
			toast.error("Failed to create invitation");
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
							<FormLabel>Slug</FormLabel>
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
						Create Invite
						{isLoading && (
							<Loader2 className="size-4 animate-spin" />
						)}
					</Button>
				</DialogFooter>
			</form>
		</Form>
	);
}
