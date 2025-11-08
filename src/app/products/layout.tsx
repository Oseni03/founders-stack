"use client";

import { useEffect } from "react";
import { authClient } from "@/lib/auth-client";
import { useOrganizationStore } from "@/zustand/providers/organization-store-provider";
import { useRouter } from "next/navigation";
import { getOrganizations } from "@/server/organizations";

export default function ProductsLayoutPage({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	const router = useRouter();
	const { data: session, isPending } = authClient.useSession();
	const { setOrganizations } = useOrganizationStore((state) => state);

	// Handle authentication redirect
	useEffect(() => {
		if (!session?.user.id && !isPending) {
			router.push("/login");
		}
	}, [session?.user.id, isPending, router]);

	// Fetch active organization
	useEffect(() => {
		const fetchOrganizations = async () => {
			if (!session?.user.id) return; // Don't fetch if no session

			const organizations = await getOrganizations();

			if (organizations) {
				setOrganizations(organizations || []);
			}
		};

		fetchOrganizations();
	}, [session, setOrganizations]);

	// Show loading state while checking auth or redirecting
	if (isPending || !session?.user.id) {
		return (
			<div className="flex items-center justify-center min-h-screen">
				<div className="animate-pulse">Loading...</div>
			</div>
		);
	}

	return (
		<div className="flex flex-1 flex-col gap-4 p-4 pt-0">{children}</div>
	);
}
