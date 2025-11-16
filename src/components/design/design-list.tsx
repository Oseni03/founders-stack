/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useState } from "react";
import { useDesignStore } from "@/zustand/providers/design-store-provider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

interface DesignListClientProps {
	initialDesigns: Array<any>; // Typed as DesignFile with relations
	initialProjects: Array<{ id: string; name: string }>;
}

export default function DesignList({
	initialDesigns,
	initialProjects,
}: DesignListClientProps) {
	const { designs, setDesigns, filters, setFilters } = useDesignStore(
		(state) => state
	);
	if (designs.length === 0) setDesigns(initialDesigns); // Hydrate store

	const [view, setView] = useState<"grid" | "list">("grid");

	// Client-side filtering (for demo; optimize with server if needed)
	const filteredDesigns = designs.filter((d) => {
		return (
			(!filters.project || d.projectId === filters.project) &&
			(!filters.status || d.status === filters.status) &&
			(!filters.fileType || d.fileType === filters.fileType)
			// Add lastUpdated logic (e.g., date filtering) as needed
		);
	});

	return (
		<div className="space-y-4">
			<div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
				<h1 className="text-2xl font-bold text-foreground">Designs</h1>
				<div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
					<ToggleGroup
						type="single"
						value={view}
						onValueChange={(v) => setView(v as "grid" | "list")}
					>
						<ToggleGroupItem value="grid">Grid</ToggleGroupItem>
						<ToggleGroupItem value="list">List</ToggleGroupItem>
					</ToggleGroup>
					<Select onValueChange={(v) => setFilters({ project: v })}>
						<SelectTrigger className="w-[180px]">
							<SelectValue placeholder="Project" />
						</SelectTrigger>
						<SelectContent>
							{initialProjects.map((p) => (
								<SelectItem key={p.id} value={p.id}>
									{p.name}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
					<Select onValueChange={(v) => setFilters({ status: v })}>
						<SelectTrigger className="w-[180px]">
							<SelectValue placeholder="Status" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="In Progress">
								In Progress
							</SelectItem>
							<SelectItem value="Ready for Review">
								Ready for Review
							</SelectItem>
							<SelectItem value="Approved">Approved</SelectItem>
							<SelectItem value="Ready for Dev">
								Ready for Dev
							</SelectItem>
						</SelectContent>
					</Select>
					{/* Add more filters similarly */}
				</div>
			</div>
			{view === "grid" ? (
				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
					{filteredDesigns.map((d) => (
						<Card key={d.id} className="shadow-sm">
							<CardHeader className="p-0">
								{d.thumbnailUrl ? (
									<Image
										src={d.thumbnailUrl}
										alt={d.name}
										width={300}
										height={200}
										className="rounded-t-md object-cover"
									/>
								) : (
									<Skeleton className="h-40 w-full rounded-t-md" />
								)}
							</CardHeader>
							<CardContent className="p-4">
								<CardTitle className="text-lg">
									{d.name}
								</CardTitle>
								<Badge variant="secondary" className="mt-2">
									{d.status}
								</Badge>
								<p className="text-sm text-muted-foreground mt-1">
									💬 {d.comments?.length || 0}
								</p>
								<p className="text-sm text-muted-foreground">
									{d.lastEditorName} •{" "}
									{new Date(d.updatedAt).toLocaleString()}
								</p>
								<Link
									href={`/design/${d.id}`}
									className="text-primary hover:underline"
								>
									View Details
								</Link>
							</CardContent>
						</Card>
					))}
				</div>
			) : (
				<div className="space-y-4">
					{filteredDesigns.map((d) => (
						<Card key={d.id} className="shadow-sm">
							<CardContent className="p-4">
								<div className="flex justify-between items-start">
									<div>
										<CardTitle className="text-lg">
											{d.name}
										</CardTitle>
										<p className="text-sm text-muted-foreground">
											Project: {d.project?.name} | Status:{" "}
											{d.status}
										</p>
										<p className="text-sm text-muted-foreground">
											Last edited: {d.lastEditorName},{" "}
											{new Date(
												d.updatedAt
											).toLocaleString()}
										</p>
										<p className="text-sm text-muted-foreground">
											💬 {d.comments?.length || 0}{" "}
											unresolved comments | 🔗 Linked
											tasks
										</p>
									</div>
									<div className="flex gap-2">
										<Link
											href={d.url || "#"}
											className="text-primary"
										>
											View in {d.platform}
										</Link>
										<button className="text-primary">
											Approve
										</button>
										<button className="text-primary">
											Add Comment
										</button>
									</div>
								</div>
							</CardContent>
						</Card>
					))}
				</div>
			)}
		</div>
	);
}
