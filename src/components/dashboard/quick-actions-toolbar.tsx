"use client";

import { Button } from "@/components/ui/button";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Bell, Plus, RefreshCw } from "lucide-react";
import { GlobalSearch } from "./global-search";

export function QuickActionsToolbar() {
	return (
		<div className="flex items-center justify-between gap-4 p-4 flex-wrap">
			<div className="flex items-center gap-2 flex-1 min-w-[200px] max-w-md">
				<GlobalSearch />
			</div>

			<div className="flex items-center gap-2">
				<Select defaultValue="7d">
					<SelectTrigger className="w-[120px]">
						<SelectValue placeholder="Time range" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="24h">Last 24h</SelectItem>
						<SelectItem value="7d">Last 7 days</SelectItem>
						<SelectItem value="30d">Last 30 days</SelectItem>
						<SelectItem value="90d">Last 90 days</SelectItem>
					</SelectContent>
				</Select>

				<Button variant="outline" size="icon">
					<RefreshCw className="h-4 w-4" />
				</Button>

				<Button variant="outline" size="icon">
					<Bell className="h-4 w-4" />
				</Button>

				<Button size="sm" className="gap-2">
					<Plus className="h-4 w-4" />
					<span className="hidden sm:inline">Add Widget</span>
				</Button>
			</div>
		</div>
	);
}
