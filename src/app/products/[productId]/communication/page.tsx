// app/messages/page.tsx
import { getMessages } from "@/server/categories/communication"; // Server action import
import CommunicationClient from "@/components/communication/communication-client";

export default async function CommunicationPage({
	params,
}: {
	params: Promise<{ productId: string }>;
}) {
	const { productId } = await params;
	const initialMessages = await getMessages(productId); // Fetch on server

	return <CommunicationClient initialMessages={initialMessages} />;
}
