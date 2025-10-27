import { FinanceStoreProvider } from "@/zustand/providers/finance-store-provider";

export default function FinanceLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<>
			<FinanceStoreProvider>{children}</FinanceStoreProvider>
		</>
	);
}
