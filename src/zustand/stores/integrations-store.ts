import { Integration } from "@prisma/client";
import { toast } from "sonner";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";

export interface IntegrationsState {
	integrations: Integration[];
	loading: boolean;
	syncLoading: boolean;
	error: string | null;
	fetchIntegrations: () => Promise<void>;
	connect: (toolName: string) => Promise<void>;
	disconnect: (integrationId: string) => Promise<void>;
	sync: (integrationId: string) => Promise<void>;
}

export const createIntegrationsStore = () => {
	return create<IntegrationsState>()(
		persist(
			immer((set) => ({
				integrations: [],
				loading: false,
				syncLoading: false,
				error: null,
				fetchIntegrations: async () => {
					set((state) => {
						state.loading = true;
						state.error = null;
					});
					try {
						const response = await fetch("/api/integrations");
						const data = await response.json();
						set((state) => {
							state.integrations = data.integrations;
							state.loading = false;
						});
					} catch (error) {
						console.error("Failed to fetch integrations:", error);
						set((state) => {
							state.loading = false;
							state.error = "Integrations not found";
						});
					}
				},
				connect: async (toolName) => {
					set((state) => {
						state.loading = true;
						state.error = null;
					});
					try {
						const resp = await fetch(
							`/api/integrations/${toolName}/connect`
						);
						if (resp.ok) {
							const data = await resp.json();
							if (data.url) {
								toast.success(`Redirecting to ${toolName}...`);
								window.location.href = data.url;
							}
						} else {
							throw new Error(`Failed to connect ${toolName}`);
						}
					} catch (error) {
						console.error(`Failed to connect ${toolName}: `, error);
						set((state) => {
							state.loading = false;
							state.error = `Failed to connect ${toolName}`;
						});
					}
				},
				disconnect: async (integrationId) => {
					set((state) => {
						state.loading = true;
						state.error = null;
					});
					try {
						const response = await fetch(
							`/api/integrations/${integrationId}/disconnect`,
							{
								method: "POST",
							}
						);

						if (response.ok) {
							set((state) => {
								state.integrations = state.integrations.filter(
									(item) => item.id !== integrationId
								);
								state.loading = false;
							});
							toast.success(
								"Integration disconnected successfully!"
							);
						}
					} catch (error) {
						console.error(
							"Failed to disconnect integration:",
							error
						);
						set((state) => {
							state.loading = false;
							state.error = "Failed to disconnect integration";
						});
					}
				},
				sync: async (integrationId) => {
					set((state) => {
						state.syncLoading = true;
						state.error = null;
					});
					try {
						await fetch(`/api/integrations/${integrationId}/sync`, {
							method: "POST",
						});
						// await fetchIntegrations();
						set((state) => {
							state.syncLoading = false;
						});
					} catch (error) {
						console.error("Failed to sync integration:", error);
						set((state) => {
							state.syncLoading = false;
							state.error = "Failed to sync integration";
						});
					}
				},
			})),
			{ name: "integrations-store" }
		)
	);
};
