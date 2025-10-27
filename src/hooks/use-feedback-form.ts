// hooks/useFeedbackForm.ts
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

export type FeedbackFormValues = {
	title: string;
	details: string;
};

export function useFeedbackForm() {
	const form = useForm<FeedbackFormValues>({
		defaultValues: {
			title: "",
			details: "",
		},
	});

	const [loading, setLoading] = useState(false);

	const onSubmit = async (values: FeedbackFormValues) => {
		setLoading(true);

		try {
			const CANNY_API_KEY = process.env.NEXT_PUBLIC_CANNY_API_KEY;
			const BOARD_ID = process.env.NEXT_PUBLIC_CANNY_BOARD_ID;
			const AUTHOR_ID = process.env.NEXT_PUBLIC_CANNY_AUTHOR_ID;

			const response = await fetch(
				"https://canny.io/api/v1/posts/create",
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						apiKey: CANNY_API_KEY,
						boardID: BOARD_ID,
						title: values.title,
						details: values.details,
						authorID: AUTHOR_ID,
					}),
				}
			);

			const data = await response.json();

			if (response.ok) {
				toast.success("Thanks for your feedback!");
				form.reset();
			} else {
				toast.error(data.error || "Failed to submit feedback.");
			}
		} catch (error) {
			console.error("Feedback error:", error);
			toast.error("Something went wrong while submitting your feedback.");
		} finally {
			setLoading(false);
		}
	};

	return { form, onSubmit, loading };
}
