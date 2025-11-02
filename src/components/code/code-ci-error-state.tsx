"use client";

import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import Link from "next/link";

export function CodeCIErrorState({
	error,
	onRetry,
}: {
	error: string;
	onRetry: () => void;
}) {
	return (
		<main className="min-h-screen bg-background">
			<div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
				<div className="flex h-[calc(100vh-8rem)] items-center justify-center">
					<div className="text-center">
						<Alert variant="destructive" className="mb-6 max-w-md">
							<AlertCircle className="h-5 w-5" />
							<AlertTitle>Error</AlertTitle>
							<AlertDescription>{error}</AlertDescription>
						</Alert>
						<div className="flex justify-center gap-4">
							<Button onClick={onRetry}>Retry</Button>
							<Link href="/dashboard">
								<Button variant="outline">
									Back to Dashboard
								</Button>
							</Link>
						</div>
					</div>
				</div>
			</div>
		</main>
	);
}
