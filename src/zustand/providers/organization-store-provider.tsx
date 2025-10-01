"use client";

import { type ReactNode, createContext, useRef, useContext } from "react";
import { useStore } from "zustand";
import {
	type OrganizationStore,
	createOrganizationStore,
} from "@/zustand/stores/organization-store";

export type OrganizationStoreApi = ReturnType<typeof createOrganizationStore>;

export const OrganizationStoreContext = createContext<
	OrganizationStoreApi | undefined
>(undefined);

export interface OrganizationStoreProviderProps {
	children: ReactNode;
}

export const OrganizationStoreProvider = ({
	children,
}: OrganizationStoreProviderProps) => {
	const storeRef = useRef<OrganizationStoreApi | null>(null);
	if (storeRef.current === null) {
		// const { data: session } = authClient.useSession();
		// const { data: activeOrganization } = authClient.useActiveOrganization();
		// const { data: organizations } = authClient.useListOrganizations();

		// const initialOrg: OrganizationState = {
		// 	activeOrganization:
		// 		(activeOrganization as Organization) ||
		// 		(organizations?.[0] as Organization),
		// 	members: activeOrganization?.members || [],
		// 	invitations: activeOrganization?.invitations || [],
		// 	organizations: (organizations as Organization[]) || [],
		// 	isAdmin: !!activeOrganization?.members?.find(
		// 		(member) =>
		// 			member.userId == session?.user?.id && member.role == "admin"
		// 	),
		// 	isLoading: false,
		// };
		// storeRef.current = createOrganizationStore(initialOrg);
		storeRef.current = createOrganizationStore();
	}

	return (
		<OrganizationStoreContext.Provider value={storeRef.current}>
			{children}
		</OrganizationStoreContext.Provider>
	);
};

export const useOrganizationStore = <T,>(
	selector: (store: OrganizationStore) => T
): T => {
	const organizationStoreContext = useContext(OrganizationStoreContext);

	if (!organizationStoreContext) {
		throw new Error(
			`useOrganizationStore must be used within OrganizationStoreProvider`
		);
	}

	return useStore(organizationStoreContext, selector);
};
