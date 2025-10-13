import React from "react";
import { Button } from "../ui/button";
import { useIntegrationsStore } from "@/zustand/providers/integrations-store-provider";
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "../ui/dialog";
import { Input } from "../ui/input";
import { INTEGRATIONS } from "@/lib/oauth-utils";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "../ui/form";

const formSchema = z.object({
	apiKey: z.string().min(2),
	projectId: z.string().min(2),
	projectName: z.string().min(2),
});

export const APIKeyConnectForm = ({
	isOpen,
	onClose,
	integrationId,
}: {
	isOpen: boolean;
	onClose: () => void;
	integrationId: string;
}) => {
	const { connect } = useIntegrationsStore((state) => state);

	const form = useForm<z.infer<typeof formSchema>>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			apiKey: "",
			projectId: "",
			projectName: "",
		},
	});

	async function onSubmit(values: z.infer<typeof formSchema>) {
		await connect(integrationId, values);
		onClose();
	}

	const integration = INTEGRATIONS.find(
		(integration) => integration.id === integrationId
	);
	return (
		<Form {...form}>
			<Dialog open={isOpen} onOpenChange={onClose}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Connect {integration?.name}</DialogTitle>
					</DialogHeader>
					<form
						onSubmit={form.handleSubmit(onSubmit)}
						className="space-y-4"
					>
						<FormField
							control={form.control}
							name="apiKey"
							render={({ field }) => (
								<FormItem>
									<FormLabel>API Key</FormLabel>
									<FormControl>
										<Input
											placeholder={`Enter your ${integration?.name} API key`}
											{...field}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="projectId"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Project ID</FormLabel>
									<FormControl>
										<Input
											placeholder={`Enter your ${integration?.name} project ID`}
											{...field}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="projectName"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Project Name</FormLabel>
									<FormControl>
										<Input
											placeholder={`Enter your ${integration?.name} project name`}
											{...field}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<DialogFooter>
							<Button type="submit">Connect</Button>
						</DialogFooter>
					</form>
				</DialogContent>
			</Dialog>
		</Form>
	);
};
