"use client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Error({
	error,
	reset,
}: {
	error: Error;
	reset: () => void;
}) {
	return (
		<div className="container mx-auto px-4 py-6">
			<Card>
				<CardHeader>
					<CardTitle>Something went wrong</CardTitle>
				</CardHeader>
				<CardContent>
					<p className="text-muted-foreground">{error.message}</p>
					<Button onClick={reset} className="mt-4">
						Try again
					</Button>
				</CardContent>
			</Card>
		</div>
	);
}
