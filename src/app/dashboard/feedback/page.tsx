// app/feedback/page.tsx
"use client";

import { useEffect, useMemo } from "react";
import Link from "next/link";
import {
	ArrowLeft,
	MessageSquare,
	Star,
	MessageCircle,
	Filter,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	PieChart,
	Pie,
	Cell,
	BarChart,
	Bar,
	XAxis,
	YAxis,
	CartesianGrid,
	Tooltip,
	ResponsiveContainer,
} from "recharts";
import { Badge } from "@/components/ui/badge";
import { useFeedbackStore } from "@/zustand/providers/feedback-store-provider";

export default function FeedbackPage() {
	const data = useFeedbackStore((state)=>state.data)
	const loading = useFeedbackStore((state)=>state.loading)
	const timeRange = useFeedbackStore((state)=>state.timeRange)
	const selectedStatus = useFeedbackStore((state)=>state.selectedStatus)
	const selectedCategory = useFeedbackStore((state)=>state.selectedCategory)
	const setData = useFeedbackStore((state)=>state.setData)
	const setLoading = useFeedbackStore((state)=>state.setLoading)
	const setTimeRange = useFeedbackStore((state)=>state.setTimeRange)
	const setSelectedStatus = useFeedbackStore((state)=>state.setSelectedStatus)
	const setSelectedCategory = useFeedbackStore((state)=>state.setSelectedCategory)

	useEffect(() => {
		fetchMetrics();
	}, [timeRange]);

	const fetchMetrics = async () => {
		try {
			setLoading(true);
			const response = await fetch(`/api/feedbacks?range=${timeRange}`);

			if (!response.ok) throw new Error("Failed to fetch metrics");

			const fetchedData = await response.json();
			setData(fetchedData);
		} catch (err) {
			console.error("[Feedback] Fetch error:", err);
		} finally {
			setLoading(false);
		}
	};

	const filteredFeedback = useMemo(() => {
		if (!data) return [];
		return data.recentFeedback.filter(
			(item) =>
				(!selectedStatus || item.status === selectedStatus) &&
				(!selectedCategory || item.category === selectedCategory)
		);
	}, [data, selectedStatus, selectedCategory]);

	const getStatusColor = (status: string) => {
		switch (status) {
			case "Open":
				return "bg-blue-100 text-blue-700";
			case "In Progress":
				return "bg-yellow-100 text-yellow-700";
			case "Resolved":
				return "bg-green-100 text-green-700";
			default:
				return "bg-gray-100 text-gray-700";
		}
	};

	const getCategoryColor = (category: string) => {
		switch (category) {
			case "Bug":
				return "bg-red-100 text-red-700";
			case "Feature Request":
				return "bg-purple-100 text-purple-700";
			case "Improvement":
				return "bg-blue-100 text-blue-700";
			case "Documentation":
				return "bg-green-100 text-green-700";
			default:
				return "bg-gray-100 text-gray-700";
		}
	};

	if (loading) {
		return (
			<div className="flex h-screen items-center justify-center">
				<div className="text-center">
					<div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-border border-t-primary" />
					<p className="text-muted-foreground">
						Loading feedback data...
					</p>
				</div>
			</div>
		);
	}

	if (!data) {
		return (
			<div className="flex h-screen items-center justify-center">
				<div className="text-center">
					<p className="mb-4 text-lg font-semibold text-destructive">
						Failed to load feedback data
					</p>
					<Link href="/dashboard">
						<Button>Back to Dashboard</Button>
					</Link>
				</div>
			</div>
		);
	}

	return (
		<main className="min-h-screen bg-background">
			<div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
				{/* Header with Back Button */}
				<div className="mb-8 flex items-center gap-4">
					<Link href="/dashboard">
						<Button variant="ghost" size="icon">
							<ArrowLeft className="h-5 w-5" />
						</Button>
					</Link>
					<div className="flex-1">
						<h1 className="text-3xl font-bold text-foreground">
							Feedback
						</h1>
						<p className="mt-1 text-muted-foreground">
							User feedback and feature requests
						</p>
					</div>
					<div className="flex gap-2">
						<Button
							variant={timeRange === "7d" ? "default" : "outline"}
							size="sm"
							onClick={() => setTimeRange("7d")}
						>
							7d
						</Button>
						<Button
							variant={
								timeRange === "30d" ? "default" : "outline"
							}
							size="sm"
							onClick={() => setTimeRange("30d")}
						>
							30d
						</Button>
						<Button
							variant={
								timeRange === "90d" ? "default" : "outline"
							}
							size="sm"
							onClick={() => setTimeRange("90d")}
						>
							90d
						</Button>
					</div>
				</div>

				{/* Key Metrics Grid */}
				<div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
					<Card>
						<CardHeader className="pb-3">
							<CardTitle className="flex items-center gap-2 text-sm font-medium">
								<MessageSquare className="h-4 w-4 text-chart-1" />
								Total Feedback
							</CardTitle>
						</CardHeader>
						<CardContent>
							<p className="text-3xl font-bold">
								{data.totalFeedback}
							</p>
							<p className="mt-1 text-xs text-muted-foreground">
								Feedback items collected
							</p>
						</CardContent>
					</Card>

					<Card>
						<CardHeader className="pb-3">
							<CardTitle className="flex items-center gap-2 text-sm font-medium">
								<Star className="h-4 w-4 text-chart-3" />
								Average Rating
							</CardTitle>
						</CardHeader>
						<CardContent>
							<p className="text-3xl font-bold">
								{data.averageScore.toFixed(1)}
							</p>
							<p className="mt-1 text-xs text-muted-foreground">
								Out of 5 stars
							</p>
						</CardContent>
					</Card>

					<Card>
						<CardHeader className="pb-3">
							<CardTitle className="flex items-center gap-2 text-sm font-medium">
								<MessageCircle className="h-4 w-4 text-chart-2" />
								Total Comments
							</CardTitle>
						</CardHeader>
						<CardContent>
							<p className="text-3xl font-bold">
								{data.totalComments}
							</p>
							<p className="mt-1 text-xs text-muted-foreground">
								Discussion threads
							</p>
						</CardContent>
					</Card>
				</div>

				{/* Charts Grid */}
				<div className="mb-8 grid gap-6 lg:grid-cols-2">
					<Card>
						<CardHeader>
							<CardTitle>Feedback by Status</CardTitle>
							<CardDescription>
								Distribution of feedback items by status
							</CardDescription>
						</CardHeader>
						<CardContent>
							<div className="h-80 w-full">
								<ResponsiveContainer width="100%" height="100%">
									<PieChart>
										<Pie
											data={data.feedbackByStatus}
											cx="50%"
											cy="50%"
											labelLine={false}
											label={({ name, value }) =>
												`${name}: ${value}`
											}
											outerRadius={80}
											fill="#8884d8"
											dataKey="value"
										>
											<Cell fill="var(--chart-1)" />
											<Cell fill="var(--chart-3)" />
											<Cell fill="var(--chart-2)" />
										</Pie>
										<Tooltip
											contentStyle={{
												backgroundColor: "var(--card)",
												border: "1px solid var(--border)",
												borderRadius: "var(--radius)",
											}}
										/>
									</PieChart>
								</ResponsiveContainer>
							</div>
						</CardContent>
					</Card>

					<Card>
						<CardHeader>
							<CardTitle>Feedback by Category</CardTitle>
							<CardDescription>
								Distribution of feedback items by category
							</CardDescription>
						</CardHeader>
						<CardContent>
							<div className="h-80 w-full">
								<ResponsiveContainer width="100%" height="100%">
									<BarChart data={data.feedbackByCategory}>
										<CartesianGrid
											strokeDasharray="3 3"
											stroke="var(--border)"
										/>
										<XAxis
											dataKey="name"
											stroke="var(--muted-foreground)"
										/>
										<YAxis stroke="var(--muted-foreground)" />
										<Tooltip
											contentStyle={{
												backgroundColor: "var(--card)",
												border: "1px solid var(--border)",
												borderRadius: "var(--radius)",
											}}
										/>
										<Bar
											dataKey="value"
											fill="var(--chart-1)"
											name="Count"
										/>
									</BarChart>
								</ResponsiveContainer>
							</div>
						</CardContent>
					</Card>
				</div>

				{/* Filtering Controls */}
				<Card className="mb-8">
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<Filter className="h-4 w-4" />
							Feedback Items
						</CardTitle>
						<CardDescription>
							Filter and view all feedback entries
						</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="mb-6 flex flex-wrap gap-2">
							<Button
								variant={
									selectedStatus === null
										? "default"
										: "outline"
								}
								size="sm"
								onClick={() => setSelectedStatus(null)}
							>
								All Status
							</Button>
							{data.feedbackByStatus.map((status) => (
								<Button
									key={status.name}
									variant={
										selectedStatus === status.name
											? "default"
											: "outline"
									}
									size="sm"
									onClick={() =>
										setSelectedStatus(status.name)
									}
								>
									{status.name}
								</Button>
							))}
						</div>

						<div className="mb-6 flex flex-wrap gap-2">
							<Button
								variant={
									selectedCategory === null
										? "default"
										: "outline"
								}
								size="sm"
								onClick={() => setSelectedCategory(null)}
							>
								All Categories
							</Button>
							{data.feedbackByCategory.map((category) => (
								<Button
									key={category.name}
									variant={
										selectedCategory === category.name
											? "default"
											: "outline"
									}
									size="sm"
									onClick={() =>
										setSelectedCategory(category.name)
									}
								>
									{category.name}
								</Button>
							))}
						</div>

						<div className="space-y-4">
							{filteredFeedback.map((feedback) => (
								<div
									key={feedback.id}
									className="rounded-lg border border-border p-4"
								>
									<div className="mb-3 flex items-start justify-between">
										<div className="flex-1">
											<h3 className="font-semibold text-foreground">
												{feedback.title}
											</h3>
											<p className="mt-1 text-sm text-muted-foreground">
												{feedback.description}
											</p>
										</div>
									</div>

									<div className="mb-3 flex flex-wrap gap-2">
										<Badge
											className={getCategoryColor(
												feedback.category
											)}
										>
											{feedback.category}
										</Badge>
										<Badge
											className={getStatusColor(
												feedback.status
											)}
										>
											{feedback.status}
										</Badge>
										{feedback.tags.map((tag: string) => (
											<Badge key={tag} variant="outline">
												{tag}
											</Badge>
										))}
									</div>

									<div className="flex items-center justify-between text-xs text-muted-foreground">
										<div className="flex gap-4">
											<span>By {feedback.author}</span>
											<span>
												{new Date(
													feedback.date
												).toLocaleDateString()}
											</span>
											<span className="flex items-center gap-1">
												<Star className="h-3 w-3" />
												{feedback.score}/5
											</span>
											<span className="flex items-center gap-1">
												<MessageCircle className="h-3 w-3" />
												{feedback.commentsCount}{" "}
												comments
											</span>
										</div>
										{feedback.url && (
											<a
												href={feedback.url}
												target="_blank"
												rel="noopener noreferrer"
												className="text-primary hover:underline"
											>
												View
											</a>
										)}
									</div>
								</div>
							))}
						</div>
					</CardContent>
				</Card>

				{/* Insights */}
				<Card>
					<CardHeader>
						<CardTitle>Key Insights</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-blue-900">
							<p className="font-medium">Analysis:</p>
							<p className="mt-2">{data.insight}</p>
						</div>
					</CardContent>
				</Card>
			</div>
		</main>
	);
}
