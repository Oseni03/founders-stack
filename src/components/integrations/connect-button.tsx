import { Integration } from "@/lib/oauth-utils";
import React, { useState } from "react";
import { Button } from "../ui/button";
import { Plug } from "lucide-react";
import { APIKeyConnectForm } from "../forms/api-key-connect-form";

export const ConnectButton = ({
	buttonText,
	loading,
	integration,
	onConnect,
}: {
	buttonText: string;
	loading: boolean;
	integration: Integration;
	onConnect: (toolName: string) => void;
}) => {
	const [isAPIKeyFormOpen, setAPIKeyFormOpen] = useState(false);

	const handleClick = () => {
		if (integration.authType === "api_key") {
			setAPIKeyFormOpen(true); // Open form for API key input
		} else {
			onConnect(integration.id); // OAuth2 flow for others
		}
	};
	return (
		<>
			<Button className="flex-1" size="sm" onClick={handleClick}>
				<Plug className="h-4 w-4 mr-2" />
				{buttonText}
			</Button>
			{integration.authType === "api_key" && (
				<APIKeyConnectForm
					loading={loading}
					isOpen={isAPIKeyFormOpen}
					onClose={() => setAPIKeyFormOpen(false)}
					integrationId={integration.id}
				/>
			)}
		</>
	);
};
