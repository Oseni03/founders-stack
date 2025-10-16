"use client";

import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Loader2, AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useIntegrationOnboarding } from "@/hooks/use-integration-onboarding";

export default function IntegrationOnboardingPage() {
	const {
		tool,
		loading,
		error,
		dialogOpen,
		totalCount,
		totalPages,
		searchTerm,
		resources,
		hasMore,
		isLoadingMore,
		selectedResources,
		currentPage,
		toggleSelection,
		handleLoadMore,
		handleDialogClose,
		setSearchTerm,
		handleSave,
	} = useIntegrationOnboarding();

	// Customize title based on tool
	const getDialogTitle = () => {
		if (!tool) return "Select Resources";

		switch (tool) {
			case "github":
				return "Select GitHub Repositories";
			case "jira":
				return "Select Jira Projects";
			case "linear":
				return "Select Linear Projects";
			case "asana":
				return "Select Asana Projects";
			default:
				return `Select ${tool.charAt(0).toUpperCase() + tool.slice(1)} Resources`;
		}
	};

	return (
		<div className="flex min-h-screen flex-col items-center justify-center p-6">
			<Dialog open={dialogOpen} onOpenChange={handleDialogClose}>
				<DialogContent className="sm:max-w-md">
					<DialogHeader>
						<DialogTitle>{getDialogTitle()}</DialogTitle>
					</DialogHeader>

					<div className="space-y-4">
						<Input
							placeholder="Search resources..."
							value={searchTerm}
							onChange={(e) => setSearchTerm(e.target.value)}
						/>

						{loading ? (
							<div className="space-y-2">
								{[1, 2, 3, 4, 5].map((i) => (
									<Skeleton key={i} className="h-10 w-full" />
								))}
							</div>
						) : error ? (
							<div className="flex items-center justify-center py-8 text-destructive">
								<AlertCircle className="mr-2 h-4 w-4" />
								<span>{error}</span>
							</div>
						) : (
							<>
								<ScrollArea className="h-[300px] pr-4">
									{resources.length === 0 ? (
										<div className="flex items-center justify-center py-8">
											<p className="text-muted-foreground">
												{searchTerm
													? "No resources match your search."
													: "No resources found."}
											</p>
										</div>
									) : (
										<div className="space-y-2">
											{resources.map((resource) => (
												<div
													key={resource.externalId}
													className="flex items-center space-x-2 py-2 px-2 hover:bg-accent rounded-md transition-colors"
												>
													<Checkbox
														id={resource.externalId}
														checked={selectedResources.includes(
															resource.externalId
														)}
														onCheckedChange={() =>
															toggleSelection(
																resource.externalId
															)
														}
													/>
													<Label
														htmlFor={
															resource.externalId
														}
														className="flex-1 cursor-pointer"
													>
														{resource.name}
													</Label>
												</div>
											))}

											{/* Load More Button */}
											{hasMore && (
												<div className="pt-4 flex justify-center border-t">
													<Button
														variant="outline"
														size="sm"
														onClick={handleLoadMore}
														disabled={isLoadingMore}
														className="w-full"
													>
														{isLoadingMore ? (
															<>
																<Loader2 className="mr-2 h-4 w-4 animate-spin" />
																Loading more...
															</>
														) : (
															`Load More (${currentPage} of ${totalPages})`
														)}
													</Button>
												</div>
											)}
										</div>
									)}
								</ScrollArea>

								{/* Pagination Info */}
								{resources.length > 0 && (
									<div className="text-xs text-muted-foreground text-center pt-2 border-t">
										Showing {resources.length} of{" "}
										{totalCount} resources
										{hasMore &&
											` • Page ${currentPage} of ${totalPages}`}
									</div>
								)}
							</>
						)}
					</div>

					<DialogFooter className="flex-col sm:flex-row gap-2">
						<Button
							variant="outline"
							onClick={() => handleDialogClose(false)}
						>
							Cancel
						</Button>
						<Button
							onClick={handleSave}
							disabled={selectedResources.length === 0 || loading}
						>
							{loading ? (
								<>
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
									Loading...
								</>
							) : (
								`Add Selected (${selectedResources.length})`
							)}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
