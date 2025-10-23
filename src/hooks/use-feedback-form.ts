"use client";

import { useState } from "react";
import { toast } from "sonner";

const useFeedbackForm = () => {
	const [title, setTitle] = useState("");
	const [details, setDetails] = useState("");
	const [loading, setLoading] = useState(false);
	const [status, setStatus] = useState({ type: "", message: "" });

	const handleSubmit = async () => {
		if (!title.trim() || !details.trim()) {
			setStatus({
				type: "error",
				message: "Please fill in both title and details",
			});
			return;
		}

		setLoading(true);
		setStatus({ type: "", message: "" });

		try {
			// Replace these with your actual Canny credentials
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
						title: title,
						details: details,
						authorID: AUTHOR_ID,
					}),
				}
			);

			const data = await response.json();

			if (response.ok) {
				setStatus({
					type: "success",
					message:
						"Feedback submitted successfully! Thank you for your input.",
				});
				toast.success("Feedback submitted successfully!");
				setTitle("");
				setDetails("");
			} else {
				setStatus({
					type: "error",
					message:
						data.error ||
						"Failed to submit feedback. Please try again.",
				});
			}
		} catch (error) {
			setStatus({
				type: "error",
				message:
					"An error occurred. Please check your API credentials and try again.",
			});
			console.error("Submission error:", error);
		} finally {
			setLoading(false);
		}
	};
	return {
		title,
		details,
		loading,
		status,
		setTitle,
		setDetails,
		handleSubmit,
	};
};

export default useFeedbackForm;
