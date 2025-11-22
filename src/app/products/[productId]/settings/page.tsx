"use client";

import { useState } from "react";
import { GlassCard } from "@/components/dashboard/glass-card";
import {
	Github,
	Slack,
	MessageSquare,
	CheckCircle2,
	Plus,
	CreditCard,
	Shield,
	Trash2,
	ExternalLink,
	Mail,
	Clock,
} from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export default function Settings() {
	const [activeTab, setActiveTab] = useState<
		"integrations" | "team" | "weights" | "billing"
	>("integrations");

	const tabs = [
		{ id: "integrations", label: "Integrations" },
		{ id: "team", label: "Team" },
		{ id: "weights", label: "Algorithm" },
		{ id: "billing", label: "Billing" },
	];

	return (
		<>
			<header className="mb-8">
				<h1 className="text-3xl font-display font-bold text-white mb-2">
					Settings
				</h1>
				<p className="text-muted-foreground">
					Manage your workspace configuration
				</p>
			</header>

			<div className="flex flex-col lg:flex-row gap-8">
				{/* Sidebar Navigation */}
				<div className="w-full lg:w-64 shrink-0 space-y-2">
					{tabs.map((tab) => (
						<Button
							key={tab.id}
							onClick={() =>
								setActiveTab(
									tab.id as
										| "integrations"
										| "team"
										| "weights"
										| "billing"
								)
							}
							className={cn(
								"w-full text-left px-4 py-3 rounded-xl transition-all font-medium text-sm",
								activeTab === tab.id
									? "bg-primary/20 text-primary border border-primary/20"
									: "text-muted-foreground hover:text-white hover:bg-white/5"
							)}
						>
							{tab.label}
						</Button>
					))}
				</div>

				{/* Content Area */}
				<div className="flex-1 min-w-0 space-y-6">
					{activeTab === "integrations" && <IntegrationsSettings />}
					{activeTab === "team" && <TeamSettings />}
					{activeTab === "weights" && <WeightsSettings />}
					{activeTab === "billing" && <BillingSettings />}
				</div>
			</div>
		</>
	);
}

function IntegrationsSettings() {
	return (
		<div className="space-y-6">
			<GlassCard title="Connected Tools" className="overflow-visible">
				<div className="space-y-4">
					<IntegrationRow
						icon={
							<div className="w-10 h-10 bg-[#5E6AD2] rounded-lg flex items-center justify-center text-white font-bold">
								L
							</div>
						}
						name="Linear"
						description="Sync issues, cycles, and estimates"
						connected={true}
					/>
					<IntegrationRow
						icon={
							<Github className="w-10 h-10 p-2 bg-black text-white rounded-lg border border-white/20" />
						}
						name="GitHub"
						description="Track PRs, reviews, and blockers"
						connected={true}
					/>
					<IntegrationRow
						icon={
							<MessageSquare className="w-10 h-10 p-2 bg-[#0057FF] text-white rounded-lg" />
						}
						name="Intercom"
						description="Analyze customer conversations"
						connected={true}
					/>
					<IntegrationRow
						icon={
							<Slack className="w-10 h-10 p-2 bg-[#4A154B] text-white rounded-lg" />
						}
						name="Slack"
						description="Daily digest and notifications"
						connected={false}
					/>
				</div>
			</GlassCard>
		</div>
	);
}

function IntegrationRow({
	icon,
	name,
	description,
	connected,
}: {
	icon: React.ReactNode;
	name: string;
	description: string;
	connected: boolean;
}) {
	return (
		<div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 transition-colors">
			<div className="flex items-center gap-4">
				{icon}
				<div>
					<h4 className="font-bold text-white">{name}</h4>
					<p className="text-sm text-muted-foreground">
						{description}
					</p>
				</div>
			</div>
			<Button
				className={cn(
					"px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2",
					connected
						? "bg-green-500/10 text-green-400 border border-green-500/20 hover:bg-green-500/20"
						: "bg-white/10 text-white hover:bg-white/20"
				)}
			>
				{connected ? (
					<>
						<CheckCircle2 size={16} />
						Connected
					</>
				) : (
					"Connect"
				)}
			</Button>
		</div>
	);
}

function TeamSettings() {
	const [open, setOpen] = useState(false);
	const [pendingInvites, setPendingInvites] = useState<
		{ email: string; role: string }[]
	>([]);
	const [inviteEmail, setInviteEmail] = useState("");
	const [inviteRole, setInviteRole] = useState("editor");

	const handleInvite = () => {
		if (!inviteEmail) return;
		setPendingInvites([
			...pendingInvites,
			{ email: inviteEmail, role: inviteRole },
		]);
		setInviteEmail("");
		setOpen(false);
	};

	const members = [
		{
			name: "Sarah Connor",
			role: "Admin",
			email: "sarah@apex.com",
			avatar: "SC",
		},
		{
			name: "John Reese",
			role: "Editor",
			email: "john@apex.com",
			avatar: "JR",
		},
		{
			name: "Root Admin",
			role: "Viewer",
			email: "admin@apex.com",
			avatar: "RA",
		},
	];

	return (
		<div className="space-y-6">
			<GlassCard
				title="Team Members"
				action={
					<Dialog open={open} onOpenChange={setOpen}>
						<DialogTrigger asChild>
							<button className="bg-primary text-white px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-primary/90 transition-colors">
								<Plus size={16} /> Invite Member
							</button>
						</DialogTrigger>
						<DialogContent className="sm:max-w-[425px] bg-[#0A0A0B] border-white/10 text-white">
							<DialogHeader>
								<DialogTitle>Invite Teammate</DialogTitle>
								<DialogDescription className="text-muted-foreground">
									Send an invitation to join your workspace.
								</DialogDescription>
							</DialogHeader>
							<div className="grid gap-4 py-4">
								<div className="grid gap-2">
									<Label
										htmlFor="email"
										className="text-white"
									>
										Email
									</Label>
									<Input
										id="email"
										value={inviteEmail}
										onChange={(e) =>
											setInviteEmail(e.target.value)
										}
										placeholder="colleague@company.com"
										className="bg-white/5 border-white/10 text-white"
									/>
								</div>
								<div className="grid gap-2">
									<Label
										htmlFor="role"
										className="text-white"
									>
										Role
									</Label>
									<Select
										value={inviteRole}
										onValueChange={setInviteRole}
									>
										<SelectTrigger className="bg-white/5 border-white/10 text-white">
											<SelectValue placeholder="Select a role" />
										</SelectTrigger>
										<SelectContent className="bg-[#0A0A0B] border-white/10 text-white">
											<SelectItem value="admin">
												Admin
											</SelectItem>
											<SelectItem value="editor">
												Editor
											</SelectItem>
											<SelectItem value="viewer">
												Viewer
											</SelectItem>
										</SelectContent>
									</Select>
								</div>
							</div>
							<DialogFooter>
								<button
									onClick={handleInvite}
									className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
								>
									Send Invitation
								</button>
							</DialogFooter>
						</DialogContent>
					</Dialog>
				}
			>
				<div className="space-y-2">
					{members.map((member, i) => (
						<div
							key={i}
							className="flex items-center justify-between p-3 rounded-xl hover:bg-white/5 transition-colors group"
						>
							<div className="flex items-center gap-3">
								<Avatar className="h-10 w-10 border border-white/10">
									<AvatarImage src="" />
									<AvatarFallback className="bg-white/10 text-white">
										{member.avatar}
									</AvatarFallback>
								</Avatar>
								<div>
									<div className="font-medium text-white">
										{member.name}
									</div>
									<div className="text-xs text-muted-foreground">
										{member.email}
									</div>
								</div>
							</div>
							<div className="flex items-center gap-4">
								<span className="text-sm text-muted-foreground bg-white/5 px-2 py-1 rounded capitalize">
									{member.role}
								</span>
								<Button className="text-muted-foreground hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100">
									<Trash2 size={16} />
								</Button>
							</div>
						</div>
					))}

					{/* Pending Invites */}
					{pendingInvites.map((invite, i) => (
						<div
							key={`invite-${i}`}
							className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-dashed border-white/10 transition-colors"
						>
							<div className="flex items-center gap-3">
								<div className="h-10 w-10 rounded-full bg-white/5 flex items-center justify-center border border-white/10 border-dashed">
									<Mail
										size={16}
										className="text-muted-foreground"
									/>
								</div>
								<div>
									<div className="font-medium text-muted-foreground italic">
										{invite.email}
									</div>
									<div className="text-xs text-primary flex items-center gap-1">
										<Clock size={10} /> Pending Accept
									</div>
								</div>
							</div>
							<div className="flex items-center gap-4">
								<span className="text-sm text-muted-foreground bg-white/5 px-2 py-1 rounded capitalize">
									{invite.role}
								</span>
								<Button
									onClick={() =>
										setPendingInvites(
											pendingInvites.filter(
												(_, idx) => idx !== i
											)
										)
									}
									className="text-muted-foreground hover:text-red-400 transition-colors"
								>
									<Trash2 size={16} />
								</Button>
							</div>
						</div>
					))}
				</div>
			</GlassCard>

			<div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-xl flex gap-3">
				<Shield className="text-blue-400 shrink-0" size={20} />
				<div>
					<h4 className="font-bold text-blue-300 text-sm">
						Access Control
					</h4>
					<p className="text-xs text-blue-200/70 mt-1">
						For the V1 launch, all team members have full visibility
						into all connected projects. RBAC (Role Based Access
						Control) is coming in V2.
					</p>
				</div>
			</div>
		</div>
	);
}

function WeightsSettings() {
	return (
		<div className="space-y-6">
			<GlassCard title="Pain Scoring Algorithm">
				<p className="text-muted-foreground text-sm mb-8">
					Adjust how Apex calculates priority scores. Changes affect
					the backlog immediately.
				</p>

				<div className="space-y-8">
					<WeightSlider
						label="Revenue Impact (MRR)"
						description="Weight given to issues affecting high-value customers"
						defaultValue={[70]}
					/>
					<WeightSlider
						label="Conversation Volume"
						description="Weight given to number of support tickets"
						defaultValue={[50]}
					/>
					<WeightSlider
						label="Recency"
						description="Weight given to new issues vs old ones"
						defaultValue={[30]}
					/>
					<WeightSlider
						label="Effort Estimate"
						description="Penalty for high-effort tasks (Quick wins prioritized)"
						defaultValue={[20]}
					/>
				</div>
			</GlassCard>
		</div>
	);
}

function WeightSlider({
	label,
	description,
	defaultValue,
}: {
	label: string;
	description: string;
	defaultValue: number[];
}) {
	return (
		<div className="space-y-3">
			<div className="flex justify-between">
				<label className="text-sm font-medium text-white">
					{label}
				</label>
				<span className="text-sm font-mono text-primary">
					{defaultValue}%
				</span>
			</div>
			<Slider
				defaultValue={defaultValue}
				max={100}
				step={1}
				className="w-full"
			/>
			<p className="text-xs text-muted-foreground">{description}</p>
		</div>
	);
}

function BillingSettings() {
	return (
		<div className="space-y-6">
			<GlassCard title="Subscription">
				<div className="flex items-start justify-between mb-8">
					<div>
						<div className="text-sm text-muted-foreground uppercase tracking-wider font-bold mb-1">
							Current Plan
						</div>
						<h2 className="text-3xl font-display font-bold text-white">
							Founding 100
						</h2>
						<p className="text-primary mt-1 font-medium">
							$299/mo (Billed Annually)
						</p>
					</div>
					<div className="bg-white/5 border border-white/10 px-3 py-1 rounded-full text-xs font-mono text-green-400 flex items-center gap-2">
						<div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
						Active
					</div>
				</div>

				<div className="space-y-4 border-t border-white/10 pt-6">
					<div className="flex justify-between items-center">
						<div className="flex items-center gap-3">
							<CreditCard
								className="text-muted-foreground"
								size={20}
							/>
							<div>
								<div className="text-white font-medium">
									Visa ending in 4242
								</div>
								<div className="text-xs text-muted-foreground">
									Expires 12/28
								</div>
							</div>
						</div>
						<Button className="text-sm text-white hover:underline">
							Update
						</Button>
					</div>
				</div>

				<div className="mt-8 flex gap-4">
					<Button className="bg-white text-black px-4 py-2 rounded-lg text-sm font-bold hover:bg-gray-200 transition-colors flex items-center gap-2">
						<ExternalLink size={16} /> Manage in Stripe
					</Button>
					<Button className="bg-white/5 text-white border border-white/10 px-4 py-2 rounded-lg text-sm font-medium hover:bg-white/10 transition-colors">
						Download Invoices
					</Button>
				</div>
			</GlassCard>
		</div>
	);
}
