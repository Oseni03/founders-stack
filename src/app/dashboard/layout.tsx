"use client";

import { useEffect } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { Separator } from "@/components/ui/separator";
import {
	SidebarInset,
	SidebarProvider,
	SidebarTrigger,
} from "@/components/ui/sidebar";
import { authClient } from "@/lib/auth-client";
import { useOrganizationStore } from "@/zustand/providers/organization-store-provider";
import { Member, Organization } from "@/types";
import { useRouter } from "next/navigation";
import { SearchStoreProvider } from "@/zustand/providers/search-store-provider";
import { useIntegrationsStore } from "@/zustand/providers/integrations-store-provider";
import { useDashboardStore } from "@/zustand/providers/dashboard-store-provider";

export default function Page({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	const router = useRouter();
	const { data: session, isPending } = authClient.useSession();
	const { data: organizations } = authClient.useListOrganizations();
	const {
		setAdmin,
		setOrganizations,
		setOrganizationData,
		setActiveOrganization,
		updateSubscription,
	} = useOrganizationStore((state) => state);
	const fetchIntegrations = useIntegrationsStore(
		(state) => state.fetchIntegrations
	);
	const { fetchMetrics, searchQuery } = useDashboardStore((state) => ({
		fetchMetrics: state.fetchData,
		searchQuery: state.searchQuery,
	}));

	// Handle authentication redirect
	useEffect(() => {
		if (!session?.user.id && !isPending) {
			router.push("/login");
		}
	}, [session?.user.id, isPending, router]);

	// Fetch active organization
	useEffect(() => {
		const fetchActiveOrg = async () => {
			if (!session?.user.id) return; // Don't fetch if no session

			const { data, error } =
				await authClient.organization.getFullOrganization();

			if (error) {
				console.error("Error fetching active organization:", error);
				return;
			}
			if (data) {
				const isAdmin = !!data?.members?.find(
					(member) =>
						member.userId == session?.user?.id &&
						member.role == "admin"
				);
				setOrganizationData(
					data as Organization,
					(data?.members as Member[]) || [],
					data?.invitations || []
				);
				setAdmin(isAdmin);

				if (session?.subscription) {
					updateSubscription(session.subscription);
				}
			} else {
				setActiveOrganization(
					session?.activeOrganizationId || organizations![0].id
				);
			}

			if (organizations) {
				setOrganizations(organizations);
			}
		};

		fetchActiveOrg();
	}, [
		session,
		organizations,
		setOrganizationData,
		setOrganizations,
		setAdmin,
		setActiveOrganization,
		updateSubscription,
	]);

	useEffect(() => {
		const fetchData = async () => {
			if (!session?.user.id) return;
			await fetchIntegrations();
			await fetchMetrics();
		};

		fetchData();
	}, [fetchIntegrations, searchQuery, fetchMetrics, session?.user.id]);

	// Show loading state while checking auth or redirecting
	if (isPending || !session?.user.id) {
		return (
			<div className="flex items-center justify-center min-h-screen">
				<div className="animate-pulse">Loading...</div>
			</div>
		);
	}

	return (
		<SearchStoreProvider>
			<SidebarProvider>
				<AppSidebar />
				<SidebarInset>
					<header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
						<div className="flex items-center gap-2 px-4">
							<SidebarTrigger className="-ml-1" />
							<Separator
								orientation="vertical"
								className="mr-2 data-[orientation=vertical]:h-4"
							/>
						</div>
					</header>
					<div className="flex flex-1 flex-col gap-4 p-4 pt-0">
						{children}
					</div>
				</SidebarInset>
			</SidebarProvider>
		</SearchStoreProvider>
	);
}
