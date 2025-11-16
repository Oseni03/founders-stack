import { CommunicationStoreProvider } from "@/zustand/providers/communication-store-provider";

export default function CommunicationLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return <CommunicationStoreProvider>{children}</CommunicationStoreProvider>;
}
