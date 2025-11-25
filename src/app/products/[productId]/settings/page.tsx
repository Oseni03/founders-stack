"use client";

import { useState } from "react";
import {
	CheckCircle2,
	Plus,
	CreditCard,
	Shield,
	Trash2,
	ExternalLink,
	Mail,
	Clock,
	Settings,
	DollarSign,
	Users,
	Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useSettingsState } from "@/hooks/use-settings";

export default function SettingsPage() {
	const {
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
	} = useSettingsState();

	const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
	const [inviteEmail, setInviteEmail] = useState("");
	const [inviteRole, setInviteRole] = useState<"admin" | "editor" | "viewer">(
		"editor"
	);

	const [disconnectDialog, setDisconnectDialog] = useState<{
		open: boolean;
		integrationId: string | null;
	}>({ open: false, integrationId: null });

	const [removeMemberDialog, setRemoveMemberDialog] = useState<{
		open: boolean;
		memberId: string | null;
	}>({ open: false, memberId: null });

	const handleInvite = () => {
		if (!inviteEmail) return;
		addTeamMember(inviteEmail, inviteRole);
		setInviteEmail("");
		setInviteRole("editor");
		setInviteDialogOpen(false);
	};

	const handleDisconnect = () => {
		if (disconnectDialog.integrationId) {
			disconnectIntegration(disconnectDialog.integrationId);
			setDisconnectDialog({ open: false, integrationId: null });
		}
	};

	const handleRemoveMember = () => {
		if (removeMemberDialog.memberId) {
			removeTeamMember(removeMemberDialog.memberId);
			setRemoveMemberDialog({ open: false, memberId: null });
		}
	};

	return (
		<div className="container mx-auto py-8 px-4 max-w-6xl">
			<div className="mb-8">
				<h1 className="text-3xl font-bold mb-2">Settings</h1>
				<p className="text-muted-foreground">
					Manage your workspace configuration
				</p>
			</div>

			<Tabs defaultValue="integrations" className="space-y-6">
				<TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
					<TabsTrigger value="integrations" className="gap-2">
						<Zap className="h-4 w-4" />
						<span className="hidden sm:inline">Integrations</span>
					</TabsTrigger>
					<TabsTrigger value="team" className="gap-2">
						<Users className="h-4 w-4" />
						<span className="hidden sm:inline">Team</span>
					</TabsTrigger>
					<TabsTrigger value="weights" className="gap-2">
						<Settings className="h-4 w-4" />
						<span className="hidden sm:inline">Algorithm</span>
					</TabsTrigger>
					<TabsTrigger value="billing" className="gap-2">
						<DollarSign className="h-4 w-4" />
						<span className="hidden sm:inline">Billing</span>
					</TabsTrigger>
				</TabsList>

				{/* Integrations Tab */}
				<TabsContent value="integrations" className="space-y-4">
					<Card>
						<CardHeader>
							<CardTitle>Connected Tools</CardTitle>
							<CardDescription>
								Manage your workspace integrations
							</CardDescription>
						</CardHeader>
						<CardContent className="space-y-4">
							{integrations.map((integration) => (
								<div
									key={integration.id}
									className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
								>
									<div className="flex items-center gap-4">
										<integration.icon className="w-10 h-10 p-2 rounded-lg" />
										<div>
											<h4 className="font-semibold">
												{integration.name}
											</h4>
											<p className="text-sm text-muted-foreground">
												{integration.description}
											</p>
										</div>
									</div>
									{integration.connected ? (
										<Button
											variant="outline"
											size="sm"
											onClick={() =>
												setDisconnectDialog({
													open: true,
													integrationId:
														integration.id,
												})
											}
											className="gap-2"
										>
											<CheckCircle2 className="h-4 w-4 text-green-600" />
											Connected
										</Button>
									) : (
										<Button
											size="sm"
											onClick={() =>
												connectIntegration(
													integration.id
												)
											}
										>
											Connect
										</Button>
									)}
								</div>
							))}
						</CardContent>
					</Card>
				</TabsContent>

				{/* Team Tab */}
				<TabsContent value="team" className="space-y-4">
					<Card>
						<CardHeader>
							<div className="flex items-center justify-between">
								<div>
									<CardTitle>Team Members</CardTitle>
									<CardDescription>
										Manage your workspace members
									</CardDescription>
								</div>
								<Dialog
									open={inviteDialogOpen}
									onOpenChange={setInviteDialogOpen}
								>
									<DialogTrigger asChild>
										<Button className="gap-2">
											<Plus className="h-4 w-4" />
											Invite Member
										</Button>
									</DialogTrigger>
									<DialogContent>
										<DialogHeader>
											<DialogTitle>
												Invite Teammate
											</DialogTitle>
											<DialogDescription>
												Send an invitation to join your
												workspace.
											</DialogDescription>
										</DialogHeader>
										<div className="space-y-4 py-4">
											<div className="space-y-2">
												<Label htmlFor="email">
													Email
												</Label>
												<Input
													id="email"
													type="email"
													value={inviteEmail}
													onChange={(e) =>
														setInviteEmail(
															e.target.value
														)
													}
													placeholder="colleague@company.com"
												/>
											</div>
											<div className="space-y-2">
												<Label htmlFor="role">
													Role
												</Label>
												<Select
													value={inviteRole}
													onValueChange={(
														value:
															| "admin"
															| "editor"
															| "viewer"
													) => setInviteRole(value)}
												>
													<SelectTrigger id="role">
														<SelectValue placeholder="Select a role" />
													</SelectTrigger>
													<SelectContent>
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
											<Button
												variant="outline"
												onClick={() =>
													setInviteDialogOpen(false)
												}
											>
												Cancel
											</Button>
											<Button onClick={handleInvite}>
												Send Invitation
											</Button>
										</DialogFooter>
									</DialogContent>
								</Dialog>
							</div>
						</CardHeader>
						<CardContent className="space-y-2">
							{teamMembers.map((member) => (
								<div
									key={member.id}
									className="flex items-center justify-between p-3 rounded-lg hover:bg-accent/50 transition-colors group"
								>
									<div className="flex items-center gap-3">
										<Avatar>
											<AvatarImage src={member.avatar} />
											<AvatarFallback>
												{member.initials}
											</AvatarFallback>
										</Avatar>
										<div>
											<div className="font-medium">
												{member.name}
											</div>
											<div className="text-sm text-muted-foreground">
												{member.email}
											</div>
										</div>
									</div>
									<div className="flex items-center gap-3">
										<Select
											value={member.role}
											onValueChange={(
												value:
													| "admin"
													| "editor"
													| "viewer"
											) =>
												updateMemberRole(
													member.id,
													value
												)
											}
										>
											<SelectTrigger className="w-[110px]">
												<SelectValue />
											</SelectTrigger>
											<SelectContent>
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
										<Button
											variant="ghost"
											size="icon"
											className="opacity-0 group-hover:opacity-100 transition-opacity"
											onClick={() =>
												setRemoveMemberDialog({
													open: true,
													memberId: member.id,
												})
											}
										>
											<Trash2 className="h-4 w-4 text-destructive" />
										</Button>
									</div>
								</div>
							))}

							{pendingInvites.length > 0 && (
								<>
									<Separator className="my-4" />
									<div className="space-y-2">
										<h4 className="text-sm font-medium text-muted-foreground">
											Pending Invitations
										</h4>
										{pendingInvites.map((invite) => (
											<div
												key={invite.id}
												className="flex items-center justify-between p-3 rounded-lg border border-dashed"
											>
												<div className="flex items-center gap-3">
													<div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
														<Mail className="h-4 w-4 text-muted-foreground" />
													</div>
													<div>
														<div className="font-medium text-muted-foreground italic">
															{invite.email}
														</div>
														<div className="text-xs text-primary flex items-center gap-1">
															<Clock className="h-3 w-3" />
															Pending Accept
														</div>
													</div>
												</div>
												<div className="flex items-center gap-3">
													<Badge
														variant="secondary"
														className="capitalize"
													>
														{invite.role}
													</Badge>
													<Button
														variant="ghost"
														size="icon"
														onClick={() =>
															cancelInvite(
																invite.id
															)
														}
													>
														<Trash2 className="h-4 w-4 text-destructive" />
													</Button>
												</div>
											</div>
										))}
									</div>
								</>
							)}
						</CardContent>
					</Card>

					<Alert>
						<Shield className="h-4 w-4" />
						<AlertTitle>Access Control</AlertTitle>
						<AlertDescription>
							For the V1 launch, all team members have full
							visibility into all connected projects. RBAC (Role
							Based Access Control) is coming in V2.
						</AlertDescription>
					</Alert>
				</TabsContent>

				{/* Algorithm Tab */}
				<TabsContent value="weights" className="space-y-4">
					<Card>
						<CardHeader>
							<CardTitle>Pain Scoring Algorithm</CardTitle>
							<CardDescription>
								Adjust how Apex calculates priority scores.
								Changes affect the backlog immediately.
							</CardDescription>
						</CardHeader>
						<CardContent className="space-y-8">
							{weights.map((weight) => (
								<div key={weight.id} className="space-y-3">
									<div className="flex justify-between items-center">
										<Label className="font-medium">
											{weight.label}
										</Label>
										<span className="text-sm font-mono text-primary">
											{weight.value}%
										</span>
									</div>
									<Slider
										value={[weight.value]}
										onValueChange={(value) =>
											updateWeight(weight.id, value[0])
										}
										max={100}
										step={1}
										className="w-full"
									/>
									<p className="text-xs text-muted-foreground">
										{weight.description}
									</p>
								</div>
							))}
						</CardContent>
					</Card>
				</TabsContent>

				{/* Billing Tab */}
				<TabsContent value="billing" className="space-y-4">
					<Card>
						<CardHeader>
							<CardTitle>Subscription</CardTitle>
						</CardHeader>
						<CardContent className="space-y-6">
							<div className="flex items-start justify-between">
								<div>
									<div className="text-sm text-muted-foreground uppercase tracking-wider font-semibold mb-1">
										Current Plan
									</div>
									<h2 className="text-3xl font-bold">
										Founding 100
									</h2>
									<p className="text-primary mt-1 font-medium">
										$299/mo (Billed Annually)
									</p>
								</div>
								<Badge className="gap-2" variant="outline">
									<div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
									Active
								</Badge>
							</div>

							<Separator />

							<div className="flex items-center justify-between">
								<div className="flex items-center gap-3">
									<CreditCard className="h-5 w-5 text-muted-foreground" />
									<div>
										<div className="font-medium">
											Visa ending in 4242
										</div>
										<div className="text-sm text-muted-foreground">
											Expires 12/28
										</div>
									</div>
								</div>
								<Button variant="outline" size="sm">
									Update
								</Button>
							</div>
						</CardContent>
						<CardFooter className="gap-4">
							<Button className="gap-2">
								<ExternalLink className="h-4 w-4" />
								Manage in Stripe
							</Button>
							<Button variant="outline">Download Invoices</Button>
						</CardFooter>
					</Card>
				</TabsContent>
			</Tabs>

			{/* Disconnect Integration Alert Dialog */}
			<AlertDialog
				open={disconnectDialog.open}
				onOpenChange={(open) =>
					!open &&
					setDisconnectDialog({ open: false, integrationId: null })
				}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>
							Disconnect Integration?
						</AlertDialogTitle>
						<AlertDialogDescription>
							This will stop syncing data from this integration.
							You can reconnect at any time. This action is
							reversible.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancel</AlertDialogCancel>
						<AlertDialogAction onClick={handleDisconnect}>
							Disconnect
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>

			{/* Remove Member Alert Dialog */}
			<AlertDialog
				open={removeMemberDialog.open}
				onOpenChange={(open) =>
					!open &&
					setRemoveMemberDialog({ open: false, memberId: null })
				}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Remove Team Member?</AlertDialogTitle>
						<AlertDialogDescription>
							This will immediately revoke this member&rsquo;s
							access to the workspace. They will no longer be able
							to view or edit any projects.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancel</AlertDialogCancel>
						<AlertDialogAction
							onClick={handleRemoveMember}
							className="bg-destructive hover:bg-destructive/90"
						>
							Remove Member
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}
