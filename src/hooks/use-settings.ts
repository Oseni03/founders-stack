import { useState } from "react";
import { Github, Slack, MessageSquare, LineChart } from "lucide-react";

export function useSettingsState() {
	const [integrations, setIntegrations] = useState([
		{
			id: "linear",
			name: "Linear",
			description: "Sync issues, cycles, and estimates",
			connected: true,
			icon: LineChart,
		},
		{
			id: "github",
			name: "GitHub",
			description: "Track PRs, reviews, and blockers",
			connected: true,
			icon: Github,
		},
		{
			id: "intercom",
			name: "Intercom",
			description: "Analyze customer conversations",
			connected: true,
			icon: MessageSquare,
		},
		{
			id: "slack",
			name: "Slack",
			description: "Daily digest and notifications",
			connected: false,
			icon: Slack,
		},
	]);

	const [teamMembers, setTeamMembers] = useState([
		{
			id: "1",
			name: "Sarah Connor",
			role: "admin" as const,
			email: "sarah@apex.com",
			avatar: "",
			initials: "SC",
		},
		{
			id: "2",
			name: "John Reese",
			role: "editor" as const,
			email: "john@apex.com",
			avatar: "",
			initials: "JR",
		},
		{
			id: "3",
			name: "Root Admin",
			role: "viewer" as const,
			email: "admin@apex.com",
			avatar: "",
			initials: "RA",
		},
	]);

	const [pendingInvites, setPendingInvites] = useState<
		Array<{ id: string; email: string; role: string }>
	>([]);

	const [weights, setWeights] = useState([
		{
			id: "revenue",
			label: "Revenue Impact (MRR)",
			description:
				"Weight given to issues affecting high-value customers",
			value: 70,
		},
		{
			id: "volume",
			label: "Conversation Volume",
			description: "Weight given to number of support tickets",
			value: 50,
		},
		{
			id: "recency",
			label: "Recency",
			description: "Weight given to new issues vs old ones",
			value: 30,
		},
		{
			id: "effort",
			label: "Effort Estimate",
			description:
				"Penalty for high-effort tasks (Quick wins prioritized)",
			value: 20,
		},
	]);

	const connectIntegration = (id: string) => {
		setIntegrations((prev) =>
			prev.map((integration) =>
				integration.id === id
					? { ...integration, connected: true }
					: integration
			)
		);
	};

	const disconnectIntegration = (id: string) => {
		setIntegrations((prev) =>
			prev.map((integration) =>
				integration.id === id
					? { ...integration, connected: false }
					: integration
			)
		);
	};

	const addTeamMember = (
		email: string,
		role: "admin" | "editor" | "viewer"
	) => {
		const newInvite = {
			id: Date.now().toString(),
			email,
			role,
		};
		setPendingInvites((prev) => [...prev, newInvite]);
	};

	const removeTeamMember = (id: string) => {
		setTeamMembers((prev) => prev.filter((member) => member.id !== id));
	};

	const updateMemberRole = (
		id: string,
		role: "admin" | "editor" | "viewer"
	) => {
		setTeamMembers((prev) =>
			prev.map((member) =>
				member.id === id ? { ...member, role } : member
			)
		);
	};

	const cancelInvite = (id: string) => {
		setPendingInvites((prev) => prev.filter((invite) => invite.id !== id));
	};

	const updateWeight = (id: string, value: number) => {
		setWeights((prev) =>
			prev.map((weight) =>
				weight.id === id ? { ...weight, value } : weight
			)
		);
	};

	return {
		integrations,
		teamMembers,
		pendingInvites,
		weights,
		connectIntegration,
		disconnectIntegration,
		addTeamMember,
		removeTeamMember,
		updateMemberRole,
		cancelInvite,
		updateWeight,
	};
}
