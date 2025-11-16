// app/support/layout.tsx
import type { Metadata } from "next";
import { cn } from "@/lib/utils";
import { SupportStoreProvider } from "@/zustand/providers/support-store-provider";

export const metadata: Metadata = {
	title: "Support Tickets",
	description: "Centralized view of support tickets",
};

export default function SupportLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<div className={cn("min-h-screen bg-background font-sans antialiased")}>
			<SupportStoreProvider>{children}</SupportStoreProvider>
		</div>
	);
}
