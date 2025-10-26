import { CodeStoreProvider } from "@/zustand/providers/code-store-provider";

export default function CodeLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<>
			<CodeStoreProvider>{children}</CodeStoreProvider>
		</>
	);
}
