"use client";

import { useEffect } from "react";
import { authClient } from "@/lib/auth-client";
import { useOrganizationStore } from "@/zustand/providers/organization-store-provider";
import { Member, Organization } from "@/types";
import { useParams, useRouter } from "next/navigation";
import { useIntegrationsStore } from "@/zustand/providers/integrations-store-provider";
import { getOrganizationById } from "@/server/organizations";
import { toast } from "sonner";
import { ProductStoreProvider } from "@/zustand/providers/product-store-provider";
import { Sidebar } from "@/components/sidebar";
import { AIChatOrb } from "@/components/ai-chat-orb";

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
		<div className="min-h-screen bg-background text-foreground selection:bg-primary/30">
			<Sidebar />
			<main className="pl-[80px] md:pl-[240px] transition-all duration-300 min-h-screen relative z-0">
				<div className="p-8 max-w-[1600px] mx-auto space-y-8">
					<ProductStoreProvider>{children}</ProductStoreProvider>
				</div>
			</main>
			<AIChatOrb />
		</div>
	);
}
