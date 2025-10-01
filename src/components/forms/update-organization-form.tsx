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
import { Organization } from "@/types";
import { DialogFooter } from "../ui/dialog";
import { useOrganizationStore } from "@/zustand/providers/organization-store-provider";
import { updateOrganization } from "@/server/organizations";

const formSchema = z.object({
	name: z.string().min(2).max(50),
	slug: z.string().min(2).max(50),
});

export function UpdateOrganizationForm({
	organization,
}: {
	organization: Organization;
}) {
	const { updateOrganization: updateOrganizationState } =
		useOrganizationStore((state) => state);
	const [isLoading, setIsLoading] = useState(false);

	const form = useForm<z.infer<typeof formSchema>>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			name: organization.name,
			slug: organization.slug,
		},
	});

	async function onSubmit(values: z.infer<typeof formSchema>) {
		try {
			toast.loading("Updating Tenants...");
			setIsLoading(true);

			const { data } = await updateOrganization(organization.id, values);

			if (data) {
				toast.dismiss();
				toast.success("Organization updated successfully");
				updateOrganizationState(data as Organization);
			} else {
				toast.dismiss();
				toast.error("Failed to update organization");
			}
		} catch (error) {
			console.error(error);
			toast.dismiss();
			toast.error("Failed to update tenant");
		} finally {
			setIsLoading(false);
		}
	}

	return (
		<Form {...form}>
			<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
				<FormField
					control={form.control}
					name="name"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Name</FormLabel>
							<FormControl>
								<Input placeholder="My Tenant" {...field} />
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>

				<FormField
					control={form.control}
					name="slug"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Slug</FormLabel>
							<FormControl>
								<Input placeholder="my-tenant" {...field} />
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>

				<DialogFooter>
					<Button disabled={isLoading} type="submit">
						Update Tenant
						{isLoading && (
							<Loader2 className="size-4 animate-spin" />
						)}
					</Button>
				</DialogFooter>
			</form>
		</Form>
	);
}
