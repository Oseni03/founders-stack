"use client";

import React from "react";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import useFeedbackForm from "@/hooks/use-feedback-form";

export default function FeedbackForm() {
	const {
		title,
		details,
		loading,
		status,
		setTitle,
		setDetails,
		handleSubmit,
	} = useFeedbackForm();

	return (
		<div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
			<Card className="w-full max-w-2xl shadow-lg">
				<CardHeader>
					<CardTitle className="text-2xl font-bold text-gray-900">
						Share Your Feedback
					</CardTitle>
					<CardDescription>
						Help us improve by sharing your thoughts, ideas, or
						reporting issues
					</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="space-y-6">
						<div className="space-y-2">
							<Label
								htmlFor="title"
								className="text-sm font-medium"
							>
								Feedback Title *
							</Label>
							<Input
								id="title"
								placeholder="Brief summary of your feedback"
								value={title}
								onChange={(e) => setTitle(e.target.value)}
								className="w-full"
								disabled={loading}
							/>
						</div>

						<div className="space-y-2">
							<Label
								htmlFor="details"
								className="text-sm font-medium"
							>
								Details *
							</Label>
							<Textarea
								id="details"
								placeholder="Provide more context and details about your feedback..."
								value={details}
								onChange={(e) => setDetails(e.target.value)}
								className="w-full min-h-[150px] resize-y"
								disabled={loading}
							/>
						</div>

						{status.message && (
							<Alert
								variant={
									status.type === "error"
										? "destructive"
										: "default"
								}
							>
								{status.type === "success" ? (
									<CheckCircle2 className="h-4 w-4" />
								) : (
									<AlertCircle className="h-4 w-4" />
								)}
								<AlertDescription>
									{status.message}
								</AlertDescription>
							</Alert>
						)}

						<Button
							onClick={handleSubmit}
							className="w-full"
							disabled={loading}
						>
							{loading ? (
								<>
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
									Submitting...
								</>
							) : (
								"Submit Feedback"
							)}
						</Button>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
