"use client";

import * as React from "react";
import { ArrowLeft, GitFork, Home, Settings } from "lucide-react";
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
						id: "products",
						label: "Products",
						icon: ArrowLeft,
						url: `/products`,
					},
					{
						id: "dashboard",
						label: "Dashboard",
						icon: Home,
						url: `/products/${productId}`,
					},
				],
			},
			{
				title: "CATEGORIES",
				url: "#",
				items: [
					{
						id: "project-tracking",
						label: "Project Tracking",
						icon: GitFork,
						url: `/products/${productId}/project-tracking`,
					},
					{
						id: "communication",
						label: "Communication",
						icon: GitFork,
						url: `/products/${productId}/communication`,
					},
					{
						id: "design",
						label: "Design",
						icon: GitFork,
						url: `/products/${productId}/design`,
					},
					{
						id: "analytics",
						label: "Analytics",
						icon: GitFork,
						url: `/products/${productId}/analytics`,
					},
					{
						id: "development",
						label: "Development",
						icon: GitFork,
						url: `/products/${productId}/development`,
					},
					{
						id: "feedback",
						label: "Support/Feedback",
						icon: GitFork,
						url: `/products/${productId}/feedback`,
					},
					{
						id: "documentation",
						label: "Documentation",
						icon: GitFork,
						url: `/products/${productId}/documentation`,
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
