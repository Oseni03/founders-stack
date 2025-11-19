// app/products/[productId]/analytics/page.tsx
import { Skeleton } from "@/components/ui/skeleton";
import { Suspense } from "react";
import { getAnalyticsData } from "@/server/categories/analytics";
import { AnalyticsClientPage } from "@/components/analytics/analytics-client-page";

// Server component for data fetching
async function AnalyticsPageServer({
	organizationId,
}: {
	organizationId: string;
}) {
	const metrics = await getAnalyticsData(organizationId);

	return <AnalyticsClientPage initialMetrics={metrics} />;
}

export default async function AnalyticsPage({
	params,
}: {
	params: Promise<{ productId: string }>;
}) {
	const { productId } = await params;

	return (
		<Suspense fallback={<Skeleton className="w-full h-[500px]" />}>
			<AnalyticsPageServer organizationId={productId} />
		</Suspense>
	);
}
