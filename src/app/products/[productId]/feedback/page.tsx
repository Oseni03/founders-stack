"use client";

import React, { useEffect, useState } from "react";
import { useFeedbackStore } from "@/zustand/providers/feedback-store-provider";
import { formatDistanceToNow } from "date-fns";
import axios from "axios";
import { FeedbackItem } from "@/types/feedback";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useParams } from "next/navigation";
import Link from "next/link";

const FeedbackPage: React.FC = () => {
	const { productId } = useParams<{ productId: string }>();
	const {
		data,
		timeRange,
		selectedSource,
		selectedType,
		selectedStatus,
		selectedSentiment,
		selectedCategory,
		setData,
		setLoading,
		setTimeRange,
		setSelectedSource,
		setSelectedType,
		setSelectedStatus,
		setSelectedSentiment,
		updateFeedback,
		setError,
	} = useFeedbackStore((state) => state);

	const [selectedFeedback, setSelectedFeedback] =
		useState<FeedbackItem | null>(null);

	useEffect(() => {
		const fetchFeedback = async () => {
			setLoading(true);
			try {
				const response = await axios.get("/api/feedback/list", {
					params: {
						organizationId: productId, // Replace with actual org ID from context
						timeRange,
						source: selectedSource,
						type: selectedType,
						status: selectedStatus,
						sentiment: selectedSentiment,
						category: selectedCategory,
					},
				});
				setData(response.data);
			} catch (error) {
				setError(
					(error as Error).message || "Failed to fetch feedback"
				);
			} finally {
				setLoading(false);
			}
		};
		fetchFeedback();
	}, [
		productId,
		timeRange,
		selectedSource,
		selectedType,
		selectedStatus,
		selectedSentiment,
		selectedCategory,
		setData,
		setLoading,
		setError,
	]);

	const handleUpdateFeedback = async (
		feedbackId: string,
		updates: Partial<FeedbackItem>
	) => {
		try {
			const response = await axios.patch("/api/feedbacks/update", {
				id: feedbackId,
				...updates,
			});
			updateFeedback(feedbackId, response.data);
		} catch (error) {
			setError((error as Error).message || "Failed to update feedback");
		}
	};

	const handleReply = async (feedbackId: string, content: string) => {
		try {
			await axios.post("/api/feedbacks/reply", {
				feedbackId,
				content,
				integrationId: "int_123", // Replace with actual integration ID
			});
			// Refresh feedback list or update comments count
		} catch (error) {
			setError((error as Error).message || "Failed to send reply");
		}
	};

	return (
		<div className="p-4">
			<h1 className="text-2xl font-bold mb-4">Feedback</h1>

			{/* Filters Bar */}
			<div className="flex flex-wrap gap-4 mb-4">
				<Select
					value={selectedSource || "all"}
					onValueChange={(value) =>
						setSelectedSource(value === "all" ? null : value)
					}
				>
					<SelectTrigger className="w-[180px]">
						<SelectValue placeholder="Source" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all">All</SelectItem>
						<SelectItem value="zendesk">Support Tickets</SelectItem>
						<SelectItem value="usertesting">
							User Testing
						</SelectItem>
						<SelectItem value="intercom">
							In-App Feedback
						</SelectItem>
					</SelectContent>
				</Select>
				<Select
					value={selectedType || "all"}
					onValueChange={(value) =>
						setSelectedType(value === "all" ? null : value)
					}
				>
					<SelectTrigger className="w-[180px]">
						<SelectValue placeholder="Type" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all">All</SelectItem>
						<SelectItem value="feature_request">
							Feature Request
						</SelectItem>
						<SelectItem value="bug">Bug</SelectItem>
						<SelectItem value="complaint">Complaint</SelectItem>
						<SelectItem value="praise">Praise</SelectItem>
					</SelectContent>
				</Select>
				<Select
					value={selectedStatus || "all"}
					onValueChange={(value) =>
						setSelectedStatus(value === "all" ? null : value)
					}
				>
					<SelectTrigger className="w-[180px]">
						<SelectValue placeholder="Status" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all">All</SelectItem>
						<SelectItem value="NEW">New</SelectItem>
						<SelectItem value="TRIAGED">Triaged</SelectItem>
						<SelectItem value="IN_PROGRESS">In Progress</SelectItem>
						<SelectItem value="RESOLVED">Resolved</SelectItem>
					</SelectContent>
				</Select>
				<Select
					value={selectedSentiment || "all"}
					onValueChange={(value) =>
						setSelectedSentiment(value === "all" ? null : value)
					}
				>
					<SelectTrigger className="w-[180px]">
						<SelectValue placeholder="Sentiment" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all">All</SelectItem>
						<SelectItem value="POSITIVE">Positive</SelectItem>
						<SelectItem value="NEUTRAL">Neutral</SelectItem>
						<SelectItem value="NEGATIVE">Negative</SelectItem>
					</SelectContent>
				</Select>
				<Select value={timeRange} onValueChange={setTimeRange}>
					<SelectTrigger className="w-[180px]">
						<SelectValue placeholder="Time Range" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="7d">Last 7 days</SelectItem>
						<SelectItem value="30d">Last 30 days</SelectItem>
						<SelectItem value="custom">Custom</SelectItem>
					</SelectContent>
				</Select>
			</div>

			{/* Tabs */}
			<Tabs defaultValue="list" className="w-full">
				<TabsList>
					<TabsTrigger value="list">Feedback List</TabsTrigger>
					<TabsTrigger value="feature-requests">
						Top Feature Requests
					</TabsTrigger>
					<TabsTrigger value="sentiment">
						Sentiment Analysis
					</TabsTrigger>
					<TabsTrigger value="user-testing">
						User Testing Sessions
					</TabsTrigger>
				</TabsList>

				<TabsContent value="list">
					<div className="grid gap-4">
						{data?.recentFeedback.map((item) => (
							<Card
								key={item.id}
								className="cursor-pointer hover:bg-gray-50"
								onClick={() => setSelectedFeedback(item)}
							>
								<CardContent className="pt-4">
									<div className="flex justify-between">
										<div>
											<h3 className="font-semibold">
												{item.title}
											</h3>
											<p className="text-sm text-gray-500">
												{item.platform} |{" "}
												{item.category} |{" "}
												{formatDistanceToNow(
													new Date(item.createdAt)
												)}{" "}
												ago
											</p>
											<p className="text-sm">
												User: {item.userEmail} |{" "}
												{item.sentiment}{" "}
												{item.sentimentScore}
											</p>
											{item.votes > 0 && (
												<Badge variant="secondary">
													{item.votes} votes
												</Badge>
											)}
										</div>
										<div className="flex gap-2">
											<Button
												size="sm"
												onClick={(e) => {
													e.stopPropagation();
													handleUpdateFeedback(
														item.id,
														{ status: "TRIAGED" }
													);
												}}
											>
												Triage
											</Button>
											<Button
												size="sm"
												onClick={(e) => {
													e.stopPropagation();
													handleReply(
														item.id,
														"Thanks for your feedback!"
													);
												}}
											>
												Reply
											</Button>
										</div>
									</div>
								</CardContent>
							</Card>
						))}
					</div>
				</TabsContent>

				<TabsContent value="feature-requests">
					<div className="grid gap-4">
						{data?.topFeatureRequests.map((item) => (
							<Card key={item.id}>
								<CardContent className="pt-4">
									<h3 className="font-semibold">
										{item.title}
									</h3>
									<p className="text-sm">
										{item.votes} votes | Status:{" "}
										{item.status}
									</p>
									<Button
										size="sm"
										onClick={() =>
											handleUpdateFeedback(item.id, {
												status: "PLANNED",
											})
										}
									>
										Mark as Planned
									</Button>
								</CardContent>
							</Card>
						))}
					</div>
				</TabsContent>

				<TabsContent value="sentiment">
					<div className="flex flex-col gap-4">
						<h3 className="text-lg font-semibold">
							NPS Score: {data?.npsScore}
						</h3>
						{/* Sentiment Trend Chart */}
						<div className="h-64">
							{/* 
                Chart.js rendering placeholder. 
                The following Chart.js configuration would be rendered here using a custom chart component.
                {
                  "type": "line",
                  "data": {
                    "labels": ${JSON.stringify(data?.sentimentTrend.map((t) => t.date))},
                    "datasets": [
                      {
                        "label": "Positive",
                        "data": ${JSON.stringify(data?.sentimentTrend.map((t) => t.positive))},
                        "borderColor": "#10B981",
                        "backgroundColor": "rgba(16, 185, 129, 0.2)"
                      },
                      {
                        "label": "Negative",
                        "data": ${JSON.stringify(data?.sentimentTrend.map((t) => t.negative))},
                        "borderColor": "#EF4444",
                        "backgroundColor": "rgba(239, 68, 68, 0.2)"
                      },
                      {
                        "label": "Neutral",
                        "data": ${JSON.stringify(data?.sentimentTrend.map((t) => t.neutral))},
                        "borderColor": "#6B7280",
                        "backgroundColor": "rgba(107, 114, 128, 0.2)"
                      }
                    ]
                  },
                  "options": {
                    "scales": {
                      "y": {
                        "beginAtZero": true
                      }
                    }
                  }
                }
              */}
						</div>
						{/* Word Cloud */}
						<div>
							<h4 className="text-md font-semibold">
								Common Terms
							</h4>
							<div className="flex gap-2 flex-wrap">
								{data?.commonTerms.map((term) => (
									<Badge key={term.term} variant="secondary">
										{term.term} ({term.count})
									</Badge>
								))}
							</div>
						</div>
					</div>
				</TabsContent>

				<TabsContent value="user-testing">
					<div className="grid gap-4">
						<Card>
							<CardContent className="pt-4">
								<h3 className="font-semibold">
									Session: Checkout Flow
								</h3>
								<p>Completed: 2 days ago</p>
								<p>
									Insights: Users struggled with payment
									selection
								</p>
								<Button size="sm">View Video</Button>
							</CardContent>
						</Card>
					</div>
				</TabsContent>
			</Tabs>

			{/* Feedback Detail Panel */}
			{selectedFeedback && (
				<div className="fixed right-0 top-0 h-full w-96 bg-white p-4 shadow-lg overflow-auto">
					<Card>
						<CardHeader>
							<CardTitle>{selectedFeedback.title}</CardTitle>
							<Badge>{selectedFeedback.platform}</Badge>
						</CardHeader>
						<CardContent>
							<p>Sentiment: {selectedFeedback.sentiment}</p>
							<p>Votes: {selectedFeedback.votes}</p>
							<Select
								value={selectedFeedback.status}
								onValueChange={(value) =>
									handleUpdateFeedback(selectedFeedback.id, {
										status: value,
									})
								}
							>
								<SelectTrigger className="w-full">
									<SelectValue placeholder="Status" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="NEW">New</SelectItem>
									<SelectItem value="TRIAGED">
										Triaged
									</SelectItem>
									<SelectItem value="IN_PROGRESS">
										In Progress
									</SelectItem>
									<SelectItem value="RESOLVED">
										Resolved
									</SelectItem>
								</SelectContent>
							</Select>
							<Select
								value={selectedFeedback.priority || ""}
								onValueChange={(value) =>
									handleUpdateFeedback(selectedFeedback.id, {
										priority: value,
									})
								}
							>
								<SelectTrigger className="w-full mt-2">
									<SelectValue placeholder="Priority" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="LOW">Low</SelectItem>
									<SelectItem value="MEDIUM">
										Medium
									</SelectItem>
									<SelectItem value="HIGH">High</SelectItem>
								</SelectContent>
							</Select>
							<div className="mt-4">
								<h3 className="font-semibold">User Info</h3>
								<p>Name: {selectedFeedback.userName}</p>
								<p>Email: {selectedFeedback.userEmail}</p>
								<p>Segment: {selectedFeedback.userSegment}</p>
							</div>
							<div className="mt-4">
								<h3 className="font-semibold">
									Feedback Content
								</h3>
								<p>{selectedFeedback.description}</p>
								{selectedFeedback.url && (
									<Link
										href={selectedFeedback.url}
										target="_blank"
										rel="noopener noreferrer"
										className="text-blue-600 hover:underline"
									>
										View Original
									</Link>
								)}
							</div>
							<div className="mt-4">
								<h3 className="font-semibold">Actions</h3>
								<div className="flex gap-2">
									<Button
										onClick={() =>
											handleReply(
												selectedFeedback.id,
												"Thanks for your feedback!"
											)
										}
									>
										Reply
									</Button>
									<Button
									// onClick={() =>
									// 	handleUpdateFeedback(
									// 		selectedFeedback.id,
									// 		{ linkedFeature: "feature_123" }
									// 	)
									// }
									>
										Link to Jira
									</Button>
								</div>
							</div>
							<Button
								variant="destructive"
								className="mt-4 w-full"
								onClick={() => setSelectedFeedback(null)}
							>
								Close
							</Button>
						</CardContent>
					</Card>
				</div>
			)}
		</div>
	);
};

export default FeedbackPage;
