import { AnalyticsStoreProvider } from "@/zustand/providers/analytics-store-provider";

export default function AnalyticsLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<>
			<AnalyticsStoreProvider>{children}</AnalyticsStoreProvider>
		</>
	);
}
