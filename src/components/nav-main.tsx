"use client";

import { ArrowLeft, type LucideIcon } from "lucide-react";
import {
	SidebarGroup,
	SidebarGroupLabel,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
} from "@/components/ui/sidebar";
import { usePathname, useRouter } from "next/navigation";
import { buttonVariants } from "./ui/button";
import { cn } from "@/lib/utils";
import Link from "next/link";

export function NavMain({
	productId,
	items,
	isAccountPage = false,
}: {
	productId: string;
	items: {
		id: string;
		label: string;
		url: string;
		icon?: LucideIcon;
	}[];
	isAccountPage: boolean;
}) {
	const router = useRouter();
	const pathname = usePathname();
	return (
		<SidebarGroup>
			<SidebarGroupLabel>Platform</SidebarGroupLabel>
			<SidebarMenu>
				{isAccountPage && (
					<Link
						href={`/products/${productId}`}
						className={cn(
							buttonVariants({ variant: "ghost" }),
							"flex items-center gap-2 justify-start"
						)}
					>
						<ArrowLeft className="h-4 w-4" />
						Back to Dashboard
					</Link>
				)}
				{items.map((item) => {
					const activeTab = item.url == pathname;
					return (
						<SidebarMenuItem key={item.id}>
							<SidebarMenuButton
								tooltip={item.label}
								onClick={() => router.push(item.url)}
								isActive={activeTab}
							>
								{item.icon && <item.icon />}
								<span>{item.label}</span>
							</SidebarMenuButton>
						</SidebarMenuItem>
					);
				})}
			</SidebarMenu>
		</SidebarGroup>
	);
}
