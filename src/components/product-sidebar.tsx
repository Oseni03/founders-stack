"use client";

import * as React from "react";
import {
	BarChart3,
	CreditCard,
	FileText,
	GitFork,
	Headphones,
	Home,
	LayoutDashboard,
	Mail,
	MessageSquare,
	MessagesSquare,
	Settings,
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
import { useParams, usePathname } from "next/navigation";
import { NavSecondary } from "./nav-secondary";
import Link from "next/link";

const getNavs = (productId: string) => {
	return {
		navMain: [
			{
				title: "OVERVIEW",
				url: "#",
				items: [
					{
						id: "dashboard",
						label: "Dashboard",
						icon: Home,
						url: `/products/${productId}`,
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
						url: `/products/${productId}/version-control`,
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
						url: `/products/${productId}/financials`,
					},
					// {
					// 	id: "subscription-management",
					// 	label: "Subscription Management",
					// 	icon: RefreshCw,
					// 	url: `/products/${productId}/payments/subscriptions`,
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
						url: `/products/${productId}/analytics`,
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
					// 	url: `/products/${productId}/marketing/seo",
					// },
					{
						id: "email-marketing",
						label: "Email Marketing",
						icon: Mail,
						url: `/products/${productId}/email-marketing`,
					},
					// {
					// 	id: "social-media-management",
					// 	label: "Social Media Management",
					// 	icon: Share2,
					// 	url: `/products/${productId}/marketing/social",
					// },
					{
						id: "customer-feedback",
						label: "Customer Feedback",
						icon: MessageSquare,
						url: `/products/${productId}/feedback`,
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
						url: `/products/${productId}/support`,
					},
					// {
					// 	id: "crm-platforms",
					// 	label: "CRM Platforms",
					// 	icon: Users,
					// 	url: `/products/${productId}/platforms`,
					// },
					// {
					// 	id: "live-chat",
					// 	label: "Live Chat",
					// 	icon: MessageCircle,
					// 	url: `/products/${productId}/crm/chat`,
					// },
					// {
					// 	id: "scheduling",
					// 	label: "Scheduling",
					// 	icon: Calendar,
					// 	url: `/products/${productId}/crm/scheduling`,
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
						url: `/products/${productId}/project-management`,
					},
					{
						id: "team-communication",
						label: "Team Communication",
						icon: MessagesSquare,
						url: `/products/${productId}/communication`,
					},
					// {
					// 	id: "documentation",
					// 	label: "Documentation",
					// 	icon: BookOpen,
					// 	url: `/products/${productId}/pm/docs`,
					// },
					// {
					// 	id: "goal-tracking",
					// 	label: "Goal Tracking",
					// 	icon: Target,
					// 	url: `/products/${productId}/pm/goals`,
					// },
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
						url: `/products/${productId}/integrations`,
					},
				],
			},
		],
		navSecondary: [
			{
				title: "Settings",
				icon: Settings,
				url: `/products/${productId}/settings`,
			},
		],
	};
};

export function ProductSidebar({
	...props
}: React.ComponentProps<typeof Sidebar>) {
	const pathname = usePathname();
	const { productId } = useParams();

	const data = React.useMemo(() => {
		return getNavs(productId as string);
	}, [productId]);

	return (
		<Sidebar collapsible="icon" {...props}>
			<SidebarHeader>
				<TeamSwitcher />
			</SidebarHeader>
			<SidebarContent>
				{/* We create a SidebarGroup for each parent. */}
				{data.navMain.map((item) => (
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
				<NavUser productId={productId as string} />
			</SidebarFooter>
			<SidebarRail />
		</Sidebar>
	);
}
