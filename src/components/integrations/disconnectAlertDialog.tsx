"use client";

import React from "react";
import { Button } from "../ui/button";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "../ui/alert-dialog";
import { Integration } from "@prisma/client";
import { useIntegrationsStore } from "@/zustand/providers/integrations-store-provider";

export const DisconnectAlertDialog = ({
	integration,
}: {
	integration: Integration;
}) => {
	const disconnect = useIntegrationsStore((state) => state.disconnect);
	return (
		<AlertDialog>
			<AlertDialogTrigger asChild>
				<Button variant="outline" size="sm">
					Disconnect
				</Button>
			</AlertDialogTrigger>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>
						Disconnect {integration?.toolName}?
					</AlertDialogTitle>
					<AlertDialogDescription>
						This will stop syncing data from {integration?.toolName}
						. Your existing data will be preserved, but no new data
						will be imported.
					</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel>Cancel</AlertDialogCancel>
					<AlertDialogAction
						onClick={() => disconnect(integration.id)}
					>
						Disconnect
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
};
