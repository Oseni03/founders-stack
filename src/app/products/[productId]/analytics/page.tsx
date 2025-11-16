// app/analytics/page.tsx
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
	const metrics = await getAnalyticsData(organizationId); // Use server action to fetch

	return <AnalyticsClientPage initialMetrics={metrics} />;
}

export default function AnalyticsPage({
	params,
}: {
	params: { productId: string };
}) {
	return (
		<Suspense fallback={<Skeleton className="w-full h-[500px]" />}>
			<AnalyticsPageServer organizationId={params.productId} />
		</Suspense>
	);
}
