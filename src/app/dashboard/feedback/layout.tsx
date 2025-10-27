import { FeedbackStoreProvider } from "@/zustand/providers/feedback-store-provider";

export default function FeedbackLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<>
			<FeedbackStoreProvider>{children}</FeedbackStoreProvider>
		</>
	);
}
