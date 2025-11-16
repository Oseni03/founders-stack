import { Suspense } from "react";
import { FeedbackFilters } from "@/components/feedbacks/feedback-filters";
import { FeedbackTabs } from "@/components/feedbacks/feedback-tabs";
import { FeedbackDetailPanel } from "@/components/feedbacks/feedback-detail-panel";
import { getFeedbackItems } from "@/server/categories/feedbacks";
import { Card } from "@/components/ui/card";

export default async function FeedbackPage({
	params,
}: {
	params: Promise<{ productId: string }>;
}) {
	const { productId } = await params;
	const feedbackItems = await getFeedbackItems(productId);

	return (
		<Suspense fallback={<div>Loading feedback...</div>}>
			<div className="flex flex-col lg:flex-row gap-6">
				<Card className="flex-1 p-6">
					<FeedbackFilters />
					<FeedbackTabs initialFeedback={feedbackItems} />
				</Card>
				<FeedbackDetailPanel productId={productId} />
			</div>
		</Suspense>
	);
}
