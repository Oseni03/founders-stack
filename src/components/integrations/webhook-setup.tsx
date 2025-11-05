import ReactMarkdown from "react-markdown";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { CopyButton } from "@/components/ui/copy-button";
import { generateWebhookUrl } from "@/lib/utils";

// Assuming these types are defined elsewhere
interface Webhook {
	instructions: string;
	confirmLabel?: string;
}

interface Organization {
	id: string;
}

interface Integration {
	id: string;
}

interface Props {
	webhook: Webhook;
	organization: Organization;
	integration: Integration;
	webhookConfirmed: boolean;
	setWebhookConfirmed: (confirmed: boolean) => void;
}

export default function WebhookSetup({
	webhook,
	organization,
	integration,
	webhookConfirmed,
	setWebhookConfirmed,
}: Props) {
	return (
		<>
			<div className="space-y-4">
				<Alert>
					<AlertDescription>
						<ReactMarkdown>{webhook.instructions}</ReactMarkdown>
					</AlertDescription>
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
						onCheckedChange={(c) => setWebhookConfirmed(c === true)}
					/>
					<label htmlFor="webhook-ok" className="text-sm">
						{webhook.confirmLabel ?? "I have added the webhook URL"}
					</label>
				</div>
			</div>
		</>
	);
}
