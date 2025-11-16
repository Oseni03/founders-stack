import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
	return (
		<div className="container mx-auto px-4 py-6">
			<div className="flex flex-col lg:flex-row gap-6">
				<div className="flex-1">
					<Skeleton className="h-12 w-full mb-6" />
					<Skeleton className="h-8 w-full mb-2" />
					<Skeleton className="h-8 w-full mb-2" />
					<Skeleton className="h-8 w-full mb-2" />
				</div>
				<div className="w-full lg:w-1/3">
					<Skeleton className="h-96 w-full" />
				</div>
			</div>
		</div>
	);
}
