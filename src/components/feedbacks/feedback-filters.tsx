"use client";
import { useFeedbackStore } from "@/zustand/providers/feedback-store-provider";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";

export function FeedbackFilters() {
	const { filters, setFilters } = useFeedbackStore((state) => ({
		filters: state.filters,
		setFilters: state.setFilters,
	}));

	return (
		<div className="flex flex-col md:flex-row gap-4 mb-6">
			<Select
				value={filters.source}
				onValueChange={(value) => setFilters({ source: value })}
			>
				<SelectTrigger className="w-full md:w-40">
					<SelectValue placeholder="Source" />
				</SelectTrigger>
				<SelectContent>
					<SelectItem value="all">All Sources</SelectItem>
					<SelectItem value="zendesk">Support Tickets</SelectItem>
					<SelectItem value="usertesting">User Testing</SelectItem>
					<SelectItem value="intercom">In-App Feedback</SelectItem>
					<SelectItem value="survey">Surveys</SelectItem>
				</SelectContent>
			</Select>

			<Select
				value={filters.type}
				onValueChange={(value) => setFilters({ type: value })}
			>
				<SelectTrigger className="w-full md:w-40">
					<SelectValue placeholder="Type" />
				</SelectTrigger>
				<SelectContent>
					<SelectItem value="all">All Types</SelectItem>
					<SelectItem value="feature">Feature Request</SelectItem>
					<SelectItem value="bug">Bug</SelectItem>
					<SelectItem value="complaint">Complaint</SelectItem>
					<SelectItem value="praise">Praise</SelectItem>
				</SelectContent>
			</Select>

			<Select
				value={filters.status}
				onValueChange={(value) => setFilters({ status: value })}
			>
				<SelectTrigger className="w-full md:w-40">
					<SelectValue placeholder="Status" />
				</SelectTrigger>
				<SelectContent>
					<SelectItem value="all">All Statuses</SelectItem>
					<SelectItem value="NEW">New</SelectItem>
					<SelectItem value="TRIAGED">Triaged</SelectItem>
					<SelectItem value="IN_PROGRESS">In Progress</SelectItem>
					<SelectItem value="RESOLVED">Resolved</SelectItem>
				</SelectContent>
			</Select>

			<Select
				value={filters.sentiment}
				onValueChange={(value) => setFilters({ sentiment: value })}
			>
				<SelectTrigger className="w-full md:w-40">
					<SelectValue placeholder="Sentiment" />
				</SelectTrigger>
				<SelectContent>
					<SelectItem value="all">All Sentiments</SelectItem>
					<SelectItem value="positive">Positive</SelectItem>
					<SelectItem value="neutral">Neutral</SelectItem>
					<SelectItem value="negative">Negative</SelectItem>
				</SelectContent>
			</Select>

			<Select
				value={filters.dateRange}
				onValueChange={(value) => setFilters({ dateRange: value })}
			>
				<SelectTrigger className="w-full md:w-40">
					<SelectValue placeholder="Date Range" />
				</SelectTrigger>
				<SelectContent>
					<SelectItem value="last7days">Last 7 Days</SelectItem>
					<SelectItem value="last30days">Last 30 Days</SelectItem>
					<SelectItem value="custom">Custom</SelectItem>
				</SelectContent>
			</Select>
		</div>
	);
}
