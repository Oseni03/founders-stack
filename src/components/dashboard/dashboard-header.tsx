"use client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Bell, Search, User, Settings, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";

export function DashboardHeader() {
	const router = useRouter();

	return (
		<header className="flex items-center justify-between border-b bg-background p-4">
			<div className="flex items-center space-x-4">
				<div className="relative">
					<Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
					<Input
						placeholder="Search across all tools..."
						className="pl-8 w-[300px]"
					/>
				</div>
				<Button variant="outline" size="sm">
					<span className="mr-2">Quick Actions</span>
					<kbd className="rounded bg-muted px-1.5 py-0.5 text-xs">
						⌘ K
					</kbd>
				</Button>
			</div>
			<div className="flex items-center space-x-4">
				<Button variant="ghost" size="icon" className="relative">
					<Bell className="h-5 w-5" />
					<span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-red-500" />
				</Button>
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button variant="ghost" size="icon">
							<User className="h-5 w-5" />
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent align="end">
						<DropdownMenuItem>Workspace Switcher</DropdownMenuItem>
						<DropdownMenuItem
							onClick={() => router.push("/settings")}
						>
							<Settings className="mr-2 h-4 w-4" />
							Account Settings
						</DropdownMenuItem>
						<DropdownMenuItem
							onClick={() => router.push("/integrations")}
						>
							Connected Integrations
						</DropdownMenuItem>
						<DropdownMenuItem
							onClick={() => router.push("/logout")}
						>
							<LogOut className="mr-2 h-4 w-4" />
							Logout
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			</div>
		</header>
	);
}
