"use client";

import * as React from "react";
import {
	ArrowLeft,
	BarChart3,
	CreditCard,
	FileText,
	GitFork,
	Headphones,
	Home,
	LayoutDashboard,
	MessageSquare,
	MessagesSquare,
	Settings,
	Settings2,
	User,
} from "lucide-react";
import { NavUser } from "@/components/nav-user";
import { TeamSwitcher } from "@/components/team-switcher";
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarGroup,
	SidebarGroupContent,
	SidebarGroupLabel,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarRail,
} from "@/components/ui/sidebar";
import { usePathname } from "next/navigation";
import { NavSecondary } from "./nav-secondary";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { buttonVariants } from "./ui/button";

const data = {
	account: [
		{
			title: "ACCOUNT",
			url: "#",
			items: [
				{
					id: "profile",
					label: "Profile",
					url: "/dashboard/account",
					icon: User,
				},
				{
					id: "preferences",
					label: "Preferences",
					url: "/dashboard/account/preferences",
					icon: Settings2,
				},
			],
		},
	],
	navMain: [
		{
			title: "OVERVIEW",
			url: "#",
			items: [
				{
					id: "dashboard",
					label: "Dashboard",
					icon: Home,
					url: "/dashboard",
				},
			],
		},
		{
			title: "DEVELOPMENT",
			url: "#",
			items: [
				{
					id: "version-control",
					label: "Version Control",
					icon: GitFork,
					url: "/dashboard/version-control",
				},
			],
		},
		{
			title: "PAYMENT & BILLING",
			url: "#",
			items: [
				{
					id: "payment-processing",
					label: "Payment & Subscription",
					icon: CreditCard,
					url: "/dashboard/financials", // /dashboard/payments
				},
				// {
				// 	id: "subscription-management",
				// 	label: "Subscription Management",
				// 	icon: RefreshCw,
				// 	url: "/dashboard/payments/subscriptions",
				// },
			],
		},
		{
			title: "ANALYTICS & METRICS",
			url: "#",
			items: [
				{
					id: "product-analytics",
					label: "Product Analytics",
					icon: BarChart3,
					url: "/dashboard/analytics",
				},
			],
		},
		{
			title: "MARKETING & GROWTH",
			url: "#",
			items: [
				// {
				// 	id: "seo-content",
				// 	label: "SEO & Content",
				// 	icon: Search,
				// 	url: "/dashboard/marketing/seo",
				// },
				// {
				// 	id: "email-marketing",
				// 	label: "Email Marketing",
				// 	icon: Mail,
				// 	url: "/dashboard/marketing/email",
				// },
				// {
				// 	id: "social-media-management",
				// 	label: "Social Media Management",
				// 	icon: Share2,
				// 	url: "/dashboard/marketing/social",
				// },
				{
					id: "customer-feedback",
					label: "Customer Feedback",
					icon: MessageSquare,
					url: "/dashboard/feedback",
				},
			],
		},
		{
			title: "CRM & CUSTOMER SUCCESS",
			url: "#",
			items: [
				{
					id: "customer-support",
					label: "Customer Support",
					icon: Headphones,
					url: "/dashboard/support",
				},
				// {
				// 	id: "crm-platforms",
				// 	label: "CRM Platforms",
				// 	icon: Users,
				// 	url: "/dashboard/platforms",
				// },
				// {
				// 	id: "live-chat",
				// 	label: "Live Chat",
				// 	icon: MessageCircle,
				// 	url: "/dashboard/crm/chat",
				// },
				// {
				// 	id: "scheduling",
				// 	label: "Scheduling",
				// 	icon: Calendar,
				// 	url: "/dashboard/crm/scheduling",
				// },
			],
		},
		{
			title: "PROJECT MANAGEMENT & COLLABORATION",
			url: "#",
			items: [
				{
					id: "project-management",
					label: "Project Management",
					icon: LayoutDashboard,
					url: "/dashboard/project-management",
				},
				{
					id: "team-communication",
					label: "Team Communication",
					icon: MessagesSquare,
					url: "/dashboard/communication",
				},
				// {
				// 	id: "documentation",
				// 	label: "Documentation",
				// 	icon: BookOpen,
				// 	url: "/dashboard/pm/docs",
				// },
				// {
				// 	id: "goal-tracking",
				// 	label: "Goal Tracking",
				// 	icon: Target,
				// 	url: "/dashboard/pm/goals",
				// },
			],
		},
		{
			title: "OPERATIONS & ACCOUNTING",
			url: "#",
			items: [
				{
					id: "invoicing-accounting",
					label: "Invoicing & Accounting",
					icon: FileText,
					url: "/dashboard/accounting",
				},
			],
		},
		{
			title: "APPLICATION",
			url: "#",
			items: [
				{
					id: "integrations",
					label: "Integrations",
					icon: FileText,
					url: "/dashboard/integrations",
				},
			],
		},
	],
	navSecondary: [
		{
			title: "Settings",
			icon: Settings,
			url: "/dashboard/settings",
		},
	],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
	const pathname = usePathname();
	const isAccountPage =
		pathname.includes("/account") && !pathname.includes("/accounting");
	const items = isAccountPage ? data.account : data.navMain;
	return (
		<Sidebar collapsible="icon" {...props}>
			<SidebarHeader>
				<TeamSwitcher />
			</SidebarHeader>
			<SidebarContent>
				{isAccountPage && (
					<Link
						href="/dashboard"
						className={cn(
							buttonVariants({ variant: "ghost" }),
							"flex items-center gap-2 justify-start"
						)}
					>
						<ArrowLeft className="h-4 w-4" />
						Back to Dashboard
					</Link>
				)}

				{/* We create a SidebarGroup for each parent. */}
				{items.map((item) => (
					<SidebarGroup key={item.title}>
						<SidebarGroupLabel>{item.title}</SidebarGroupLabel>
						<SidebarGroupContent>
							<SidebarMenu>
								{item.items.map((item) => (
									<SidebarMenuItem key={item.id}>
										<SidebarMenuButton
											tooltip={item.label}
											isActive={item.url == pathname}
											asChild
										>
											<Link href={item.url}>
												{item.icon && (
													<item.icon className="h-5 w-5 mr-2" />
												)}
												<span>{item.label}</span>
											</Link>
										</SidebarMenuButton>
									</SidebarMenuItem>
								))}
							</SidebarMenu>
						</SidebarGroupContent>
					</SidebarGroup>
				))}
			</SidebarContent>
			<SidebarFooter>
				<NavSecondary items={data.navSecondary} />
				<NavUser />
			</SidebarFooter>
			<SidebarRail />
		</Sidebar>
	);
}
