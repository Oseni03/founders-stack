"use client";

import { useEffect } from "react";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Package, Share2, Settings } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { useOrganizationStore } from "@/zustand/providers/organization-store-provider";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { CreateOrganizationForm } from "@/components/forms/create-organization-form";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import ThemeToggle from "@/components/theme-toggle";
import { SettingsDialog } from "@/components/settings-dialog";

export default function ProductsPage() {
	const { data: session } = authClient.useSession();
	const {
		organizations,
		organizationStats,
		isLoading,
		loadOrganizationStats,
	} = useOrganizationStore((state) => state);

	useEffect(() => {
		loadOrganizationStats();
	}, [loadOrganizationStats]);

	const formatCurrency = (amount: number) => {
		return new Intl.NumberFormat("en-US", {
			style: "currency",
			currency: "USD",
			minimumFractionDigits: 0,
		}).format(amount);
	};

	const userName = session?.user?.name || "User";
	const userImage = session?.user?.image;

	return (
		<main className="min-h-screen bg-background">
			<div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
				{/* Header Section - User Info */}
				<div className="flex items-center justify-between mb-8 animate-fade-in">
					<div className="flex items-center gap-4">
						<Avatar className="h-16 w-16">
							<AvatarImage src={userImage || ""} alt={userName} />
							<AvatarFallback>
								{userName.substring(0, 2).toUpperCase()}
							</AvatarFallback>
						</Avatar>
						<div>
							<h1 className="text-2xl sm:text-3xl font-bold">
								{userName}
							</h1>
							<p className="text-muted-foreground">
								{organizations.length} product
								{organizations.length !== 1 ? "s" : ""} with
								verified revenue
							</p>
						</div>
					</div>
					<div className="flex items-center gap-2">
						<ThemeToggle />
						<Button variant="outline" size="sm" className="gap-2">
							<Share2 className="h-4 w-4" />
							<span className="hidden sm:inline">Share</span>
						</Button>
						<SettingsDialog />
					</div>
				</div>

				{isLoading ? (
					<div className="space-y-6">
						<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
							{[...Array(4)].map((_, i) => (
								<Skeleton key={i} className="h-32" />
							))}
						</div>
						<Skeleton className="h-96" />
					</div>
				) : (
					<>
						{/* Stats Overview */}
						<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8 animate-scale-in">
							<Card className="hover-scale">
								<CardHeader className="pb-2">
									<CardDescription className="text-xs">
										Total revenue
									</CardDescription>
									<CardTitle className="text-2xl sm:text-3xl font-bold">
										{formatCurrency(
											organizationStats?.totalRevenue || 0
										)}
									</CardTitle>
									<p className="text-xs text-muted-foreground">
										Across all products
									</p>
								</CardHeader>
							</Card>

							<Card className="hover-scale">
								<CardHeader className="pb-2">
									<CardDescription className="text-xs">
										Last 30 days
									</CardDescription>
									<CardTitle className="text-2xl sm:text-3xl font-bold">
										{formatCurrency(
											organizationStats?.revenue30Days ||
												0
										)}
									</CardTitle>
									<p className="text-xs text-muted-foreground">
										Recent revenue
									</p>
								</CardHeader>
							</Card>

							<Card className="hover-scale">
								<CardHeader className="pb-2">
									<CardDescription className="text-xs">
										Total MRR
									</CardDescription>
									<CardTitle className="text-2xl sm:text-3xl font-bold">
										{formatCurrency(
											organizationStats?.totalMRR || 0
										)}
									</CardTitle>
									<p className="text-xs text-muted-foreground">
										Combined MRR
									</p>
								</CardHeader>
							</Card>

							<Card className="hover-scale">
								<CardHeader className="pb-2">
									<CardDescription className="text-xs">
										Products
									</CardDescription>
									<CardTitle className="text-2xl sm:text-3xl font-bold">
										{organizationStats?.totalOrganizations ||
											0}
									</CardTitle>
									<p className="text-xs text-muted-foreground">
										{organizationStats?.totalCustomers || 0}{" "}
										total customers
									</p>
								</CardHeader>
							</Card>
						</div>

						{/* Products Section Header */}
						<div className="mb-6 animate-fade-in">
							<h2 className="text-xl sm:text-2xl font-bold">
								Products by @products_dashboard
							</h2>
						</div>

						{/* Products Grid */}
						<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 animate-scale-in">
							{organizations.map((org) => (
								<Link href={`/products/${org.id}`} key={org.id}>
									<Card className="hover-scale group cursor-pointer">
										<CardHeader className="pb-3">
											<div className="flex items-start gap-3">
												<div className="flex-shrink-0">
													<Avatar className="h-12 w-12 rounded-lg">
														<AvatarImage
															src={
																org.logo ||
																`https://api.dicebear.com/7.x/shapes/svg?seed=${org.name}`
															}
														/>
														<AvatarFallback className="rounded-lg bg-primary/10 text-primary font-bold">
															{org.name
																.substring(0, 2)
																.toUpperCase()}
														</AvatarFallback>
													</Avatar>
												</div>
												<div className="flex-1 min-w-0">
													<CardTitle className="text-base sm:text-lg mb-1 truncate">
														{org.name}
													</CardTitle>
													<CardDescription className="text-xs line-clamp-2">
														{org.description ||
															"No description available"}
													</CardDescription>
												</div>
											</div>
										</CardHeader>
										<CardContent className="space-y-3">
											<div>
												<p className="text-xs text-muted-foreground mb-1">
													Revenue (30 days)
												</p>
												<p className="text-xl sm:text-2xl font-bold">
													{formatCurrency(
														org.revenue30Days
													)}
												</p>
											</div>

											<div className="flex items-center justify-between text-sm">
												<span className="text-muted-foreground">
													Customers
												</span>
												<Badge variant="secondary">
													{org.totalCustomers}
												</Badge>
											</div>
										</CardContent>
									</Card>
								</Link>
							))}
						</div>
					</>
				)}

				{organizations.length === 0 && (
					<Card className="p-12">
						<div className="text-center space-y-3">
							<Package className="h-12 w-12 mx-auto text-muted-foreground" />
							<h3 className="text-lg font-semibold">
								No Products Yet
							</h3>
							<p className="text-muted-foreground max-w-md mx-auto">
								Start building your indie hacker portfolio!
								Create your first SaaS or startup project and
								track verified revenue as you grow.
							</p>
							<Dialog>
								<DialogTrigger asChild>
									<Button className="mt-4">
										Create Your First Product
									</Button>
								</DialogTrigger>
								<DialogContent showCloseButton={true}>
									<DialogHeader>
										<DialogTitle>Add product</DialogTitle>
										<DialogDescription>
											Add a new product to get started.
										</DialogDescription>
									</DialogHeader>
									<CreateOrganizationForm />
								</DialogContent>
							</Dialog>
						</div>
					</Card>
				)}
			</div>
		</main>
	);
}
