"use client";

import { useEffect } from "react";
import { authClient } from "@/lib/auth-client";
import { useOrganizationStore } from "@/zustand/providers/organization-store-provider";
import { Member, Organization } from "@/types";
import { useParams, useRouter } from "next/navigation";
import { useIntegrationsStore } from "@/zustand/providers/integrations-store-provider";
import { DashboardStoreProvider } from "@/zustand/providers/dashboard-store-provider";
import { getOrganizationById } from "@/server/organizations";
import { toast } from "sonner";
import {
	SidebarInset,
	SidebarProvider,
	SidebarTrigger,
} from "@/components/ui/sidebar";
import { ProductSidebar } from "@/components/product-sidebar";
import { Separator } from "@/components/ui/separator";

export default function Page({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	const { productId } = useParams<{ productId: string }>();
	const router = useRouter();
	const { data: session, isPending } = authClient.useSession();
	const { organizations, setAdmin, setOrganizationData, updateSubscription } =
		useOrganizationStore((state) => state);
	const fetchIntegrations = useIntegrationsStore(
		(state) => state.fetchIntegrations
	);

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

			const { data, success } = await getOrganizationById(productId);

			if (!success) {
				console.error("Error fetching product");
				return;
			}
			if (data) {
				const isAdmin = !!data?.members?.find(
					(member) =>
						member.userId == session?.user?.id &&
						member.role == "ADMIN"
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
				toast.error("Product not found");
				router.push("/products");
			}
		};

		fetchActiveOrg();
	}, [
		session,
		organizations,
		setOrganizationData,
		setAdmin,
		updateSubscription,
		productId,
		router,
	]);

	useEffect(() => {
		const fetchData = async () => {
			if (!session?.user.id) return;
			await fetchIntegrations();
		};

		fetchData();
	}, [fetchIntegrations, session?.user.id, productId]);

	// Show loading state while checking auth or redirecting
	if (isPending || !session?.user.id) {
		return (
			<div className="flex items-center justify-center min-h-screen">
				<div className="animate-pulse">Loading...</div>
			</div>
		);
	}

	return (
		<SidebarProvider>
			<ProductSidebar />
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
					<DashboardStoreProvider>{children}</DashboardStoreProvider>
				</div>
			</SidebarInset>
		</SidebarProvider>
	);
}
