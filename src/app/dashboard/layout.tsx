// Layout page
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
import { QuickActionsToolbar } from "@/components/dashboard/quick-actions-toolbar";
import { SearchStoreProvider } from "@/zustand/providers/search-store-provider";
import { IntegrationsStoreProvider } from "@/zustand/providers/integrations-store-provider";

export default function Page({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	const router = useRouter();
	const {
		setAdmin,
		setOrganizations,
		setOrganizationData,
		setActiveOrganization,
		updateSubscription,
	} = useOrganizationStore((state) => state);
	const { data: session } = authClient.useSession();
	const { data: organizations } = authClient.useListOrganizations();

	// Move the state update to useEffect to avoid calling it during render
	useEffect(() => {
		const fetchActiveOrg = async () => {
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

	if (!session?.user.id) {
		router.push("/login"); // Redirect to login if not authenticated
		return null; // Render nothing while redirecting
	}

	return (
		<SearchStoreProvider>
			<IntegrationsStoreProvider>
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
								<div className="ml-auto">
									<QuickActionsToolbar />
								</div>
							</div>
						</header>
						<div className="flex flex-1 flex-col gap-4 p-4 pt-0">
							{children}
						</div>
					</SidebarInset>
				</SidebarProvider>
			</IntegrationsStoreProvider>
		</SearchStoreProvider>
	);
}
