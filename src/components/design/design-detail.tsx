"use client";

import { useDesignStore } from "@/zustand/providers/design-store-provider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import Image from "next/image";
import { updateDesignStatus } from "@/server/categories/design";
import { useForm } from "react-hook-form";
import logger from "@/lib/logger";
import { DesignFile } from "@/zustand/stores/design-store";

interface DesignDetailProps {
	initialDesign: DesignFile;
}

interface CommentFormData {
	comment: string;
}

export default function DesignDetail({ initialDesign }: DesignDetailProps) {
	const { selectedDesign, setSelectedDesign } = useDesignStore(
		(state) => state
	);

	// Set initial design if selectedDesign is null
	if (!selectedDesign) {
		setSelectedDesign(initialDesign);
	}

	const { register, handleSubmit, reset } = useForm<CommentFormData>();

	const onStatusChange = async (newStatus: string) => {
		if (!selectedDesign) return;
		try {
			await updateDesignStatus(selectedDesign.id, newStatus);
			setSelectedDesign({ ...selectedDesign, status: newStatus });
			logger.info(`Design status updated to ${newStatus}`);
		} catch (error) {
			logger.error("Failed to update design status", { error });
		}
	};

	const onAddComment = async (data: CommentFormData) => {
		if (!selectedDesign) return;
		logger.info("Design comment submitted", {
			designId: selectedDesign.id,
			comment: data.comment,
		});
		// TODO: Implement server action to add comment
		reset(); // Clear form after submission
	};

	// Show loading state if selectedDesign is still null
	if (!selectedDesign) {
		return (
			<div className="space-y-4">
				<div className="flex flex-col md:flex-row justify-between items-start gap-4">
					<Skeleton className="h-8 w-64" />
					<Skeleton className="h-6 w-20" />
				</div>
				<div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
					<div className="lg:col-span-2">
						<Skeleton className="h-96 w-full rounded-md" />
						<div className="mt-4">
							<Skeleton className="h-10 w-full" />
							<Skeleton className="h-40 w-full mt-4" />
						</div>
					</div>
					<div className="space-y-4">
						<Skeleton className="h-48 w-full" />
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="space-y-4">
			<div className="flex flex-col md:flex-row justify-between items-start gap-4">
				<h1 className="text-2xl font-bold">{selectedDesign.name}</h1>
				<Badge>{selectedDesign.platform}</Badge>
			</div>
			<div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
				<div className="lg:col-span-2">
					{selectedDesign.thumbnailUrl ? (
						<Image
							src={selectedDesign.thumbnailUrl}
							alt={selectedDesign.name}
							width={800}
							height={600}
							className="rounded-md object-cover"
						/>
					) : (
						<div className="h-96 w-full bg-muted rounded-md flex items-center justify-center">
							<span className="text-muted-foreground">
								No preview available
							</span>
						</div>
					)}
					<Tabs defaultValue="comments" className="mt-4">
						<TabsList>
							<TabsTrigger value="comments">Comments</TabsTrigger>
							<TabsTrigger value="specs">
								Specifications
							</TabsTrigger>
							<TabsTrigger value="history">
								Version History
							</TabsTrigger>
							<TabsTrigger value="related">
								Related Items
							</TabsTrigger>
						</TabsList>
						<TabsContent value="comments">
							<div className="space-y-4">
								{selectedDesign.comments.length > 0 ? (
									selectedDesign.comments.map((comment) => (
										<Card key={comment.id}>
											<CardContent className="p-4">
												<p className="font-semibold">
													{comment.author.name} •{" "}
													{new Date(
														comment.createdAt
													).toLocaleString()}
												</p>
												<p>{comment.content}</p>
												<div className="flex gap-2 mt-2">
													<Button variant="ghost">
														Reply
													</Button>
													<Button variant="ghost">
														Resolve
													</Button>
													<Button variant="ghost">
														Link to Task
													</Button>
												</div>
											</CardContent>
										</Card>
									))
								) : (
									<p className="text-muted-foreground">
										No comments yet.
									</p>
								)}
								<form
									onSubmit={handleSubmit(onAddComment)}
									className="flex gap-2 mt-4"
								>
									<Input
										{...register("comment")}
										placeholder="Add comment..."
									/>
									<Button type="submit">Submit</Button>
								</form>
							</div>
						</TabsContent>
						<TabsContent value="specs">
							<p className="text-muted-foreground">
								Specifications not yet implemented.{" "}
								{/* Placeholder */}
							</p>
						</TabsContent>
						<TabsContent value="history">
							<p className="text-muted-foreground">
								Version history not yet implemented.{" "}
								{/* Placeholder */}
							</p>
						</TabsContent>
						<TabsContent value="related">
							{selectedDesign.linkedItems.length > 0 ? (
								selectedDesign.linkedItems.map((item) => (
									<p key={item.id}>
										{item.sourceType}: {item.targetType}
									</p>
								))
							) : (
								<p className="text-muted-foreground">
									No related items.
								</p>
							)}
						</TabsContent>
					</Tabs>
				</div>
				<div className="space-y-4">
					<Card>
						<CardContent className="p-4 space-y-2">
							<Button onClick={() => onStatusChange("Approved")}>
								Approve
							</Button>
							<Button variant="secondary">
								Assign for Review
							</Button>
							<Button variant="secondary">Add to Sprint</Button>
							<Button variant="secondary">Link to Task</Button>
							<Button variant="secondary">Download Assets</Button>
							<Button variant="secondary">Share</Button>
						</CardContent>
					</Card>
				</div>
			</div>
		</div>
	);
}
