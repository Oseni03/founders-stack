"use client";

import { useState } from "react";
import Link from "next/link";
import {
	LayoutDashboard,
	History,
	Settings,
	ChevronLeft,
	Menu,
	LogOut,
	ChevronsUpDown,
	Plus,
	Box,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { usePathname } from "next/navigation";

export function Sidebar() {
	const location = usePathname();
	const [isCollapsed, setIsCollapsed] = useState(false);
	const [activeProduct, setActiveProduct] = useState({
		name: "Apex",
		plan: "Pro",
	});

	const navItems = [
		{ icon: LayoutDashboard, label: "Today", href: "/dashboard" },
		{ icon: History, label: "History", href: "/history" },
		{ icon: Settings, label: "Settings", href: "/settings" },
	];

	const products = [
		{ name: "Apex", plan: "Pro" },
		{ name: "Nexus", plan: "Free" },
		{ name: "Vortex", plan: "Ent" },
	];

	return (
		<motion.aside
			initial={{ width: 240 }}
			animate={{ width: isCollapsed ? 80 : 240 }}
			className="h-screen fixed left-0 top-0 z-40 bg-black/40 backdrop-blur-xl border-r border-white/10 flex flex-col transition-all duration-300"
		>
			<div
				className={cn(
					"p-4 flex items-center gap-2",
					isCollapsed ? "justify-center" : "justify-between"
				)}
			>
				{!isCollapsed ? (
					<DropdownMenu>
						<DropdownMenuTrigger className="flex items-center gap-2 p-2 rounded-lg hover:bg-white/5 transition-colors text-left outline-none w-full">
							<div className="w-8 h-8 rounded-lg bg-primary/20 border border-primary/50 flex items-center justify-center text-primary shrink-0">
								<Box size={18} />
							</div>
							<div className="flex-1 min-w-0">
								<div className="text-sm font-bold text-white truncate">
									{activeProduct.name}
								</div>
								<div className="text-xs text-muted-foreground truncate">
									{activeProduct.plan} Plan
								</div>
							</div>
							<ChevronsUpDown
								size={16}
								className="text-muted-foreground shrink-0"
							/>
						</DropdownMenuTrigger>
						<DropdownMenuContent
							className="w-56 bg-black/90 border-white/10 text-white"
							side="bottom"
							align="start"
						>
							<DropdownMenuLabel className="text-muted-foreground text-xs uppercase tracking-wider">
								Products
							</DropdownMenuLabel>
							{products.map((p) => (
								<DropdownMenuItem
									key={p.name}
									onClick={() => setActiveProduct(p)}
									className="focus:bg-white/10 focus:text-white cursor-pointer"
								>
									<div className="flex items-center gap-2 w-full">
										<div className="w-6 h-6 rounded bg-white/10 flex items-center justify-center text-[10px] font-bold">
											{p.name[0]}
										</div>
										<span>{p.name}</span>
										{p.name === activeProduct.name && (
											<div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary" />
										)}
									</div>
								</DropdownMenuItem>
							))}
							<DropdownMenuSeparator className="bg-white/10" />
							<DropdownMenuItem className="focus:bg-white/10 focus:text-white cursor-pointer group">
								<div className="flex items-center gap-2 text-muted-foreground group-hover:text-primary transition-colors">
									<Plus size={16} />
									<span>Add Product</span>
								</div>
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				) : (
					<div className="w-8 h-8 rounded-lg bg-primary/20 border border-primary/50 flex items-center justify-center text-primary shrink-0">
						<Box size={18} />
					</div>
				)}

				<button
					onClick={() => setIsCollapsed(!isCollapsed)}
					className={cn(
						"p-1.5 rounded-md hover:bg-white/5 text-muted-foreground hover:text-white transition-colors",
						isCollapsed &&
							"absolute bottom-8 left-1/2 -translate-x-1/2"
					)}
				>
					{isCollapsed ? (
						<Menu size={20} />
					) : (
						<ChevronLeft size={20} />
					)}
				</button>
			</div>

			<nav className="flex-1 px-4 py-6 space-y-2">
				{navItems.map((item) => {
					const isActive = location === item.href;
					return (
						<Link key={item.href} href={item.href}>
							<div
								className={cn(
									"flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 cursor-pointer group relative overflow-hidden",
									isActive
										? "bg-primary/10 text-primary border border-primary/20"
										: "text-muted-foreground hover:text-white hover:bg-white/5"
								)}
							>
								{isActive && (
									<motion.div
										layoutId="activeTab"
										className="absolute inset-0 bg-primary/10 rounded-xl"
										initial={false}
										transition={{
											type: "spring",
											stiffness: 300,
											damping: 30,
										}}
									/>
								)}
								<item.icon
									size={20}
									className="relative z-10"
								/>
								{!isCollapsed && (
									<motion.span
										initial={{ opacity: 0, x: -10 }}
										animate={{ opacity: 1, x: 0 }}
										className="font-medium relative z-10"
									>
										{item.label}
									</motion.span>
								)}
							</div>
						</Link>
					);
				})}
			</nav>

			<div className="p-4 border-t border-white/10">
				<div
					className={cn(
						"flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 transition-colors cursor-pointer",
						isCollapsed && "justify-center"
					)}
				>
					<div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-500 to-cyan-500" />
					{!isCollapsed && (
						<div className="flex-1 min-w-0">
							<p className="text-sm font-medium text-white truncate">
								Sarah Connor
							</p>
							<p className="text-xs text-muted-foreground truncate">
								Head of Product
							</p>
						</div>
					)}
					{!isCollapsed && (
						<LogOut size={16} className="text-muted-foreground" />
					)}
				</div>
			</div>
		</motion.aside>
	);
}
