import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
	return (
		<div className="container mx-auto px-4 py-6 space-y-6">
			<div className="flex flex-wrap gap-4">
				<Skeleton className="h-10 w-[180px]" />
				<Skeleton className="h-10 w-[180px]" />
				<Skeleton className="h-10 w-[180px]" />
			</div>
			<div className="space-y-4">
				<Skeleton className="h-20 w-full" />
				<Skeleton className="h-20 w-full" />
				<Skeleton className="h-20 w-full" />
			</div>
		</div>
	);
}
