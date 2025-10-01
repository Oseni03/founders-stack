"use client";

import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
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
import { DialogFooter } from "../ui/dialog";
import { createOrganization } from "@/server/organizations";
import { authClient } from "@/lib/auth-client";
import { useOrganizationStore } from "@/zustand/providers/organization-store-provider";
import { Organization } from "@/types";

const formSchema = z.object({
	name: z.string().min(2).max(50),
	slug: z.string().min(2).max(50),
});

export function CreateOrganizationForm() {
	const { data } = authClient.useSession();
	const { addOrganization } = useOrganizationStore((state) => state);
	const [isLoading, setIsLoading] = useState(false);

	const user = data?.user;

	const form = useForm<z.infer<typeof formSchema>>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			name: "",
			slug: "",
		},
	});

	async function onSubmit(values: z.infer<typeof formSchema>) {
		try {
			toast.loading("Creating Tenant...");
			setIsLoading(true);

			if (!user) return;

			const { data, success } = await createOrganization(user.id, values);

			if (!data || !success) {
				toast.dismiss();
				toast.error("Failed to create tenant");
				return;
			}

			addOrganization(data as Organization);
			toast.dismiss();
			toast.success("Organization created successfully");
		} catch (error) {
			console.error(error);
			toast.dismiss();
			toast.error("Failed to create tenant");
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
						Create Tenant
						{isLoading && (
							<Loader2 className="size-4 animate-spin" />
						)}
					</Button>
				</DialogFooter>
			</form>
		</Form>
	);
}
