"use client";

import * as React from "react";
import { User, Settings2, Settings } from "lucide-react";
import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import {
	Sidebar,
	SidebarContent,
	SidebarGroup,
	SidebarGroupContent,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarProvider,
} from "@/components/ui/sidebar";
import { ProfileForm } from "@/components/forms/profile-form";
import { ThemeCard } from "@/components/settings/theme";
import { authClient } from "@/lib/auth-client";
import { Skeleton } from "@/components/ui/skeleton";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
	CardDescription,
} from "@/components/ui/card";

const data = {
	nav: [
		{
			id: "profile",
			label: "Profile",
			url: "#profile",
			icon: User,
		},
		{
			id: "preferences",
			label: "Preferences",
			url: "#preferences",
			icon: Settings2,
		},
	],
};

export function SettingsDialog() {
	const [open, setOpen] = React.useState(false);
	const [activeTab, setActiveTab] = React.useState("profile");
	const { data: session, isPending } = authClient.useSession();
	const user = session?.user;
	const [isEditing, setIsEditing] = React.useState(false);

	const handleSuccess = async () => {
		await authClient.getSession();
		setIsEditing(false);
	};

	const renderContent = () => {
		if (activeTab === "profile") {
			if (isPending) {
				return (
					<Card>
						<CardHeader className="space-y-1">
							<CardTitle className="flex items-center gap-2">
								<User className="h-4 w-4 sm:h-5 sm:w-5" />
								User Profile
							</CardTitle>
						</CardHeader>
						<CardContent className="space-y-4">
							<div className="space-y-2">
								<Skeleton className="h-4 w-16" />
								<Skeleton className="h-5 w-48" />
							</div>
							<div className="space-y-2">
								<Skeleton className="h-4 w-16" />
								<Skeleton className="h-5 w-64" />
							</div>
						</CardContent>
					</Card>
				);
			}

			if (!user) {
				return (
					<Card>
						<CardHeader className="space-y-1">
							<CardTitle className="flex items-center gap-2">
								<User className="h-4 w-4 sm:h-5 sm:w-5" />
								User Profile
							</CardTitle>
						</CardHeader>
						<CardContent>
							<p className="text-muted-foreground">
								No user data available
							</p>
						</CardContent>
					</Card>
				);
			}

			return (
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<User className="h-4 w-4" />
							User Profile
						</CardTitle>
						<CardDescription>
							View and manage your personal information.
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-6">
						{isEditing ? (
							<ProfileForm
								initialData={{
									name: user.name || "",
									email: user.email || "",
								}}
								onCancel={() => setIsEditing(false)}
								onSuccess={handleSuccess}
							/>
						) : (
							<>
								<div className="space-y-4">
									<div className="space-y-2">
										<label className="text-base font-medium block">
											Name
										</label>
										<p className="text-sm text-muted-foreground">
											{user.name || "Not provided"}
										</p>
									</div>
									<div className="space-y-2">
										<label className="text-base font-medium block">
											Email
										</label>
										<p className="text-sm text-muted-foreground break-all">
											{user.email || "Not provided"}
										</p>
									</div>
								</div>
								<div className="pt-2">
									<Button
										onClick={() => setIsEditing(true)}
										className="w-full sm:w-auto"
									>
										Edit Profile
									</Button>
								</div>
								<div className="text-xs text-muted-foreground pt-2">
									Your profile information is private and
									secure.
								</div>
							</>
						)}
					</CardContent>
				</Card>
			);
		}

		if (activeTab === "preferences") {
			return (
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<Settings2 className="h-4 w-4" />
							Account Preferences
						</CardTitle>
						<CardDescription>
							Manage your account preferences and settings.
						</CardDescription>
					</CardHeader>
					<CardContent>
						<ThemeCard />
					</CardContent>
				</Card>
			);
		}

		return null;
	};

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				<Button variant="outline" size="sm" className="gap-2">
					<Settings className="h-4 w-4" />
					<span className="hidden sm:inline">Settings</span>
				</Button>
			</DialogTrigger>
			<DialogContent className="overflow-hidden p-0 md:max-h-[500px] md:max-w-[700px] lg:max-w-[800px]">
				<DialogTitle className="sr-only">Settings</DialogTitle>
				<DialogDescription className="sr-only">
					Customize your account settings here.
				</DialogDescription>
				<SidebarProvider className="items-start">
					<Sidebar collapsible="none" className="hidden md:flex">
						<SidebarContent>
							<SidebarGroup>
								<SidebarGroupContent>
									<SidebarMenu>
										{data.nav.map((item) => (
											<SidebarMenuItem key={item.id}>
												<SidebarMenuButton
													asChild
													isActive={
														activeTab === item.id
													}
													onClick={() =>
														setActiveTab(item.id)
													}
												>
													<a href={item.url}>
														<item.icon />
														<span>
															{item.label}
														</span>
													</a>
												</SidebarMenuButton>
											</SidebarMenuItem>
										))}
									</SidebarMenu>
								</SidebarGroupContent>
							</SidebarGroup>
						</SidebarContent>
					</Sidebar>
					<main className="flex h-[480px] flex-1 flex-col overflow-hidden">
						<header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
							<div className="flex items-center gap-2 px-4">
								<Breadcrumb>
									<BreadcrumbList>
										<BreadcrumbItem className="hidden md:block">
											<BreadcrumbLink href="#">
												Settings
											</BreadcrumbLink>
										</BreadcrumbItem>
										<BreadcrumbSeparator className="hidden md:block" />
										<BreadcrumbItem>
											<BreadcrumbPage>
												{data.nav.find(
													(item) =>
														item.id === activeTab
												)?.label || "Settings"}
											</BreadcrumbPage>
										</BreadcrumbItem>
									</BreadcrumbList>
								</Breadcrumb>
							</div>
						</header>
						<div className="flex flex-1 flex-col gap-4 overflow-y-auto p-4 pt-0">
							{renderContent()}
						</div>
					</main>
				</SidebarProvider>
			</DialogContent>
		</Dialog>
	);
}
