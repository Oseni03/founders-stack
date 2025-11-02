"use client";

import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

export function TasksNoDataState() {
	return (
		<main className="min-h-screen bg-background">
			<div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
				<div className="flex h-[calc(100vh-8rem)] items-center justify-center">
					<Card className="max-w-md text-center">
						<CardHeader>
							<CardTitle className="flex items-center justify-center gap-2">
								<CheckCircle2 className="h-5 w-5 text-muted-foreground" />
								No Project Data
							</CardTitle>
						</CardHeader>
						<CardContent>
							<p className="mt-2 text-muted-foreground">
								{
									"Probably you haven't set up any project management integrations yet. Connect a service like Jira, Trello, or Asana to start tracking project health."
								}
							</p>
							<div className="mt-4 flex justify-center gap-4">
								<Link href="/dashboard/integrations">
									<Button>Connect Integration</Button>
								</Link>
								<Link href="/dashboard">
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
