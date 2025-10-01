"use client";

import * as React from "react";
import {
	CheckSquare,
	Code,
	DollarSign,
	FileText,
	Plug,
	Settings,
	Settings2,
	User,
} from "lucide-react";
import { NavMain } from "@/components/nav-main";
import { NavUser } from "@/components/nav-user";
import { TeamSwitcher } from "@/components/team-switcher";
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarHeader,
	SidebarRail,
} from "@/components/ui/sidebar";
import { usePathname } from "next/navigation";

// This is sample data.
const dashboardItems = [
	{
		id: "overview",
		label: "Overview",
		icon: FileText,
		url: "/dashboard",
	},
	{
		id: "tasks",
		label: "Tasks",
		icon: CheckSquare,
		url: "/dashboard/tasks",
	},
	{
		id: "financials",
		label: "Financials",
		icon: DollarSign,
		url: "/dashboard/financials",
	},
	{
		id: "code",
		label: "Code Activity",
		icon: Code,
		url: "/dashboard/code",
	},
	{
		id: "integrations",
		label: "Integrations",
		icon: Plug,
		url: "/dashboard/integrations",
	},
	{
		id: "analytics",
		label: "Analytics",
		icon: FileText,
		url: "/dashboard/analytics",
	},
	{
		id: "settings",
		label: "Settings",
		icon: Settings,
		url: "/dashboard/settings",
	},
];

const accountItems = [
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
];

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
	const pathname = usePathname();
	const isAccountPage = pathname.includes("/dashboard/account");
	const items = isAccountPage ? accountItems : dashboardItems;
	return (
		<Sidebar collapsible="icon" {...props}>
			<SidebarHeader>
				<TeamSwitcher />
			</SidebarHeader>
			<SidebarContent>
				<NavMain items={items} isAccountPage={isAccountPage} />
			</SidebarContent>
			<SidebarFooter>
				<NavUser />
			</SidebarFooter>
			<SidebarRail />
		</Sidebar>
	);
}
