import { ClientCodePage } from "@/components/development/client-code-page";
import { Skeleton } from "@/components/ui/skeleton";
import {
	getRepositories,
	getPullRequests,
	getCommits,
	getBuilds,
} from "@/server/categories/code";
import { Suspense } from "react";

async function CodeDataFetcher(organizationId: string) {
	const [repositories, pullRequests, commits, builds] = await Promise.all([
		getRepositories(organizationId),
		getPullRequests(organizationId, {}),
		getCommits(organizationId),
		getBuilds(organizationId),
	]);
	return { repositories, pullRequests, commits, builds };
}

export default async function DevelopmentPage({
	params,
}: {
	params: Promise<{ productId: string }>;
}) {
	const { productId } = await params;
	const data = await CodeDataFetcher(productId);
	return (
		<Suspense fallback={<Skeleton className="h-[500px] w-full" />}>
			<ClientCodePage organizationId={productId} initialData={data} />
		</Suspense>
	);
}
