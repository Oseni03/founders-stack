import React from "react";
import { useState } from "react";
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
import { Checkbox } from "../ui/checkbox";
import { Alert, AlertDescription } from "../ui/alert";
import { CopyButton } from "../ui/copy-button";
import { generateWebhookUrl } from "@/lib/utils";
import { useOrganizationStore } from "@/zustand/providers/organization-store-provider";

// Define explicit type for form values to match connect function
interface FormValues {
	apiKey: string;
	projectId?: string;
	projectName?: string;
}

// Define dynamic schema with explicit string types
const createFormSchema = (integrationId: string) => {
	switch (integrationId) {
		case "posthog":
			return z.object({
				apiKey: z.string().min(2),
				projectId: z.string().min(2),
				projectName: z.string().min(2),
			});

		default:
			return z.object({
				apiKey: z.string().min(2),
			});
	}
};

export const APIKeyConnectForm = ({
	isOpen,
	onClose,
	integrationId,
}: {
	isOpen: boolean;
	onClose: () => void;
	integrationId: string;
}) => {
	const connect = useIntegrationsStore((s) => s.connect);
	const integration = INTEGRATIONS.find((i) => i.id === integrationId)!;
	const organization = useOrganizationStore((s) => s.activeOrganization);

	// -----------------------------------------------------------------
	// 1. Form state (API key + optional fields)
	// -----------------------------------------------------------------
	const form = useForm<FormValues>({
		resolver: zodResolver(createFormSchema(integrationId)),
		defaultValues: {
			apiKey: "",
			...(integrationId === "posthog" && {
				projectId: "",
				projectName: "",
			}),
		},
	});

	// -----------------------------------------------------------------
	// 2. Webhook step state
	// -----------------------------------------------------------------
	const webhook = integration.metadata?.webhook;
	const [webhookConfirmed, setWebhookConfirmed] = useState(false);
	const [showWebhookStep, setShowWebhookStep] = useState(false);

	// -----------------------------------------------------------------
	// 3. Submit handler
	// -----------------------------------------------------------------
	const onSubmit = async (values: FormValues) => {
		if (webhook && !showWebhookStep) {
			// move to webhook step
			setShowWebhookStep(true);
			return;
		}

		await connect(integrationId, {
			...values,
			...(webhook ? { webhookConfirmed } : {}),
		});
		onClose();
	};

	// -----------------------------------------------------------------
	// 4. Render
	// -----------------------------------------------------------------
	return (
		<Form {...form}>
			<Dialog open={isOpen} onOpenChange={onClose}>
				<DialogContent className="max-w-lg">
					<DialogHeader>
						<DialogTitle>
							Connect {integration.name}
							{showWebhookStep && " – Webhook"}
						</DialogTitle>
					</DialogHeader>

					<form
						onSubmit={form.handleSubmit(onSubmit)}
						className="space-y-5"
					>
						{/* ---------- STEP 1: API KEY ---------- */}
						{!showWebhookStep && (
							<>
								<FormField
									control={form.control}
									name="apiKey"
									render={({ field }) => (
										<FormItem>
											<FormLabel>API Key</FormLabel>
											<FormControl>
												<Input
													placeholder={`Your ${integration.name} API key`}
													{...field}
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>

								{/* PostHog extra fields */}
								{integrationId === "posthog" && (
									<>
										<FormField
											control={form.control}
											name="projectId"
											render={({ field }) => (
												<FormItem>
													<FormLabel>
														Project ID
													</FormLabel>
													<FormControl>
														<Input
															placeholder="Project ID"
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
													<FormLabel>
														Project Name
													</FormLabel>
													<FormControl>
														<Input
															placeholder="Project Name"
															{...field}
														/>
													</FormControl>
													<FormMessage />
												</FormItem>
											)}
										/>
									</>
								)}
							</>
						)}

						{/* ---------- STEP 2: WEBHOOK ---------- */}
						{showWebhookStep && webhook && organization && (
							<div className="space-y-4">
								<Alert>
									<AlertDescription
										dangerouslySetInnerHTML={{
											__html: webhook.instructions,
										}}
									/>
								</Alert>

								<div className="flex items-center gap-2">
									<Input
										readOnly
										value={generateWebhookUrl(
											organization.id,
											integration.id
										)}
										className="flex-1"
									/>
									<CopyButton
										text={generateWebhookUrl(
											organization.id,
											integration.id
										)}
									/>
								</div>

								<div className="flex items-center space-x-2">
									<Checkbox
										id="webhook-ok"
										checked={webhookConfirmed}
										onCheckedChange={(c) =>
											setWebhookConfirmed(c === true)
										}
									/>
									<label
										htmlFor="webhook-ok"
										className="text-sm"
									>
										{webhook.confirmLabel ??
											"I have added the webhook URL"}
									</label>
								</div>
							</div>
						)}

						{/* ---------- FOOTER ---------- */}
						<DialogFooter className="gap-2">
							<Button
								variant="outline"
								type="button"
								onClick={onClose}
							>
								Cancel
							</Button>

							<Button
								type="submit"
								disabled={showWebhookStep && !webhookConfirmed}
							>
								{showWebhookStep
									? "Finish"
									: webhook
										? "Next"
										: "Connect"}
							</Button>
						</DialogFooter>
					</form>
				</DialogContent>
			</Dialog>
		</Form>
	);
};
