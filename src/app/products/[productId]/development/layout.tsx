import { CodeStoreProvider } from "@/zustand/providers/code-store-provider";

export default function DevelopmentLayout({
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
