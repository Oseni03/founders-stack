"use client";

import { GitBranch } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

export function CodeCINoRepositoriesState({
	hasIntegration,
}: {
	hasIntegration: boolean;
}) {
	return (
		<main className="min-h-screen bg-background">
			<div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
				<div className="flex h-[calc(100vh-8rem)] items-center justify-center">
					<Card className="max-w-md text-center">
						<CardHeader>
							<CardTitle className="flex items-center justify-center gap-2">
								<GitBranch className="h-5 w-5 text-muted-foreground" />
								No Repositories Found
							</CardTitle>
						</CardHeader>
						<CardContent>
							<p className="mt-2 text-muted-foreground">
								{hasIntegration
									? "You haven't added any repositories yet. Add a repository to start tracking Code and CI/CD metrics."
									: "You haven't set up any Code/CI integrations yet. Connect a service like GitHub to add repositories."}
							</p>
							<div className="mt-4 flex justify-center gap-4">
								{hasIntegration ? (
									<Link href="/dashboard/integrations/github/onboarding">
										<Button>Add Repository</Button>
									</Link>
								) : (
									<Link href="/dashboard/integrations">
										<Button>Connect Integration</Button>
									</Link>
								)}
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
