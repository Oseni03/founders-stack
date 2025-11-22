"use client";

import * as React from "react";
import { ArrowLeft, History, LayoutDashboard, Settings } from "lucide-react";
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
				title: "MAIN",
				url: "#",
				items: [
					{
						id: "products",
						label: "Products",
						icon: ArrowLeft,
						url: `/products`,
					},
					{
						id: "today",
						label: "Today",
						icon: LayoutDashboard,
						url: `/products/${productId}`,
					},
					{
						id: "history",
						icon: History,
						label: "History",
						url: `/products/${productId}/history`,
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
