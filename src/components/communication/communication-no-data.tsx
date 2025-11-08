"use client";

import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

export function CommunicationNoDataState({ productId }: { productId: string }) {
	return (
		<main className="min-h-screen bg-background">
			<div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
				<div className="flex h-[calc(100vh-8rem)] items-center justify-center">
					<Card className="max-w-md text-center">
						<CardHeader>
							<CardTitle className="flex items-center justify-center gap-2">
								<MessageCircle className="h-5 w-5 text-muted-foreground" />
								No Communication Data
							</CardTitle>
						</CardHeader>
						<CardContent>
							<p className="mt-2 text-muted-foreground">
								{
									"Probably you haven't set up any communication integrations yet. Connect a service like Slack or Discord to start tracking data."
								}
							</p>
							<div className="mt-4 flex justify-center gap-4">
								<Link
									href={`/products/${productId}/integrations`}
								>
									<Button>Connect Integration</Button>
								</Link>
								<Link href={`/products/${productId}`}>
									<Button variant="outline">
										Back to Dashboard
									</Button>
								</Link>
							</div>
						</CardContent>
					</Card>
				</div>
			</div>
		</main>
	);
}
