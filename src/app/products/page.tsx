"use client";

import { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
	DollarSign,
	TrendingUp,
	Package,
	ExternalLink,
	Share2,
} from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { useOrganizationStore } from "@/zustand/providers/organization-store-provider";

export default function ProductsPage() {
	const { data: session } = authClient.useSession();
	const {
		organizations,
		organizationStats,
		statsLoading,
		loadOrganizationStats,
	} = useOrganizationStore((state) => state);

	useEffect(() => {
		loadOrganizationStats();
	}, []);

	const formatCurrency = (amount: number) => {
		return new Intl.NumberFormat("en-US", {
			style: "currency",
			currency: "USD",
			minimumFractionDigits: 0,
		}).format(amount);
	};

	if (statsLoading) {
		return (
			<div className="flex items-center justify-center min-h-screen">
				<div className="text-muted-foreground">Loading...</div>
			</div>
		);
	}

	const userName = session?.user?.name || "User";
	const userImage = session?.user?.image;

	return (
		<div className="space-y-6 pb-16">
			{/* Header Section - User Info */}
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-4">
					<Avatar className="h-16 w-16">
						<AvatarImage src={userImage || ""} alt={userName} />
						<AvatarFallback>
							{userName.substring(0, 2).toUpperCase()}
						</AvatarFallback>
					</Avatar>
					<div>
						<h1 className="text-3xl font-bold tracking-tight">
							@{userName.toLowerCase().replace(/\s+/g, "_")}
						</h1>
						<p className="text-muted-foreground">
							{organizationStats?.totalOrganizations} product
							{organizationStats?.totalOrganizations !== 1
								? "s"
								: ""}{" "}
							with verified revenue
						</p>
					</div>
				</div>
				<div className="flex items-center gap-2">
					<Button variant="outline" size="sm">
						<Share2 className="h-4 w-4 mr-2" />
						Share
					</Button>
					<Button variant="outline" size="sm">
						<ExternalLink className="h-4 w-4 mr-2" />
						Visit Profile
					</Button>
				</div>
			</div>

			{/* Stats Cards */}
			<div className="grid gap-4 md:grid-cols-4">
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">
							Total Revenue
						</CardTitle>
						<DollarSign className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">
							{formatCurrency(
								organizationStats?.totalRevenue || 0
							)}
						</div>
						<p className="text-xs text-muted-foreground mt-1">
							Across all products
						</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">
							Last 30 days
						</CardTitle>
						<TrendingUp className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">
							{formatCurrency(
								organizationStats?.revenue30Days || 0
							)}
						</div>
						<p className="text-xs text-muted-foreground mt-1">
							Recent revenue
						</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">
							Total MRR
						</CardTitle>
						<DollarSign className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">
							{formatCurrency(organizationStats?.totalMRR || 0)}
						</div>
						<p className="text-xs text-muted-foreground mt-1">
							Combined MRR
						</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">
							Products
						</CardTitle>
						<Package className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">
							{organizationStats?.totalOrganizations || 0}
						</div>
						<p className="text-xs text-muted-foreground mt-1">
							{organizationStats?.totalCustomers || 0} total
							customers
						</p>
					</CardContent>
				</Card>
			</div>

			{/* Products List */}
			<div>
				<h2 className="text-xl font-semibold mb-4">
					Products by @{userName.toLowerCase().replace(/\s+/g, "_")}
				</h2>
				<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
					{organizations.map((organization) => (
						<Card
							key={organization.id}
							className="hover:shadow-md transition-shadow"
						>
							<CardHeader className="pb-3">
								<div className="flex items-start gap-3">
									<Avatar className="h-12 w-12">
										<AvatarImage
											src={organization.logo || ""}
											alt={organization.name}
										/>
										<AvatarFallback>
											{organization.name
												.substring(0, 2)
												.toUpperCase()}
										</AvatarFallback>
									</Avatar>
									<div className="flex-1 min-w-0">
										<CardTitle className="text-lg truncate">
											{organization.name}
										</CardTitle>
										<p className="text-sm text-muted-foreground line-clamp-2 mt-1">
											{organization.description ||
												"Product description"}
										</p>
									</div>
								</div>
							</CardHeader>
							<CardContent className="space-y-2">
								<div className="flex items-center justify-between text-sm">
									<span className="text-muted-foreground">
										Revenue (30 days)
									</span>
									<span className="font-semibold">
										{formatCurrency(
											organization.revenue30Days
										)}
									</span>
								</div>
								<div className="flex items-center justify-between text-sm">
									<span className="text-muted-foreground">
										Total Revenue
									</span>
									<span className="font-semibold">
										{formatCurrency(
											organization.totalRevenue
										)}
									</span>
								</div>
								<div className="flex items-center justify-between text-sm">
									<span className="text-muted-foreground">
										Customers
									</span>
									<Badge variant="secondary">
										{organization.totalCustomers}
									</Badge>
								</div>
								<div className="flex items-center justify-between text-sm pt-2 border-t">
									<span className="text-muted-foreground">
										MRR
									</span>
									<span className="font-bold text-primary">
										{formatCurrency(organization.mrr)}
									</span>
								</div>
							</CardContent>
						</Card>
					))}
				</div>
			</div>

			{organizations.length === 0 && (
				<Card className="p-12">
					<div className="text-center space-y-3">
						<Package className="h-12 w-12 mx-auto text-muted-foreground" />
						<h3 className="text-lg font-semibold">
							No Products Yet
						</h3>
						<p className="text-muted-foreground max-w-md mx-auto">
							Start building your indie hacker portfolio! Create
							your first SaaS or startup project and track
							verified revenue as you grow.
						</p>
						<Button className="mt-4">
							Create Your First Product
						</Button>
					</div>
				</Card>
			)}
		</div>
	);
}
