"use client";

import { useEffect } from "react";
import {
	Card,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Briefcase } from "lucide-react";
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
import { Skeleton } from "@/components/ui/skeleton";
import ThemeToggle from "@/components/theme-toggle";
import { SettingsDialog } from "@/components/settings-dialog";
import { ProductCard } from "@/components/dashboard/product-card";

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
								Managing {organizations.length} product
								{organizations.length !== 1 ? "s" : ""}
							</p>
						</div>
					</div>
					<div className="flex items-center gap-2">
						<ThemeToggle />
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
										Active Tasks
									</CardDescription>
									<CardTitle className="text-2xl sm:text-3xl font-bold">
										{organizationStats?.activeTasks || 0}
									</CardTitle>
									<p className="text-xs text-muted-foreground">
										Across all products
									</p>
								</CardHeader>
							</Card>
							<Card className="hover-scale">
								<CardHeader className="pb-2">
									<CardDescription className="text-xs">
										Pending Feedback
									</CardDescription>
									<CardTitle className="text-2xl sm:text-3xl font-bold">
										{organizationStats?.pendingFeedback ||
											0}
									</CardTitle>
									<p className="text-xs text-muted-foreground">
										From Intercom
									</p>
								</CardHeader>
							</Card>
							<Card className="hover-scale">
								<CardHeader className="pb-2">
									<CardDescription className="text-xs">
										Open Tickets
									</CardDescription>
									<CardTitle className="text-2xl sm:text-3xl font-bold">
										{organizationStats?.openTickets || 0}
									</CardTitle>
									<p className="text-xs text-muted-foreground">
										From Zendesk
									</p>
								</CardHeader>
							</Card>
							<Card className="hover-scale">
								<CardHeader className="pb-2">
									<CardDescription className="text-xs">
										Connected Tools
									</CardDescription>
									<CardTitle className="text-2xl sm:text-3xl font-bold">
										{organizationStats?.totalIntegrations ||
											0}
									</CardTitle>
									<p className="text-xs text-muted-foreground">
										Across all products
									</p>
								</CardHeader>
							</Card>
						</div>

						{/* Products Section Header */}
						<div className="mb-6 flex items-center justify-between animate-fade-in">
							<h2 className="text-xl sm:text-2xl font-bold">
								Products
							</h2>
							<Dialog>
								<DialogTrigger asChild>
									<Button>Add Product</Button>
								</DialogTrigger>
								<DialogContent showCloseButton={true}>
									<DialogHeader>
										<DialogTitle>Add Product</DialogTitle>
										<DialogDescription>
											Create a new product to manage its
											tools and workflows.
										</DialogDescription>
									</DialogHeader>
									<CreateOrganizationForm />
								</DialogContent>
							</Dialog>
						</div>

						{/* Products Grid */}
						<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 animate-scale-in">
							{organizations.map((product) => (
								<ProductCard
									key={product.id}
									product={product}
								/>
							))}
						</div>
					</>
				)}

				{organizations.length === 0 && (
					<Card className="p-12">
						<div className="text-center space-y-3">
							<Briefcase className="h-12 w-12 mx-auto text-muted-foreground" />
							<h3 className="text-lg font-semibold">
								No Products Yet
							</h3>
							<p className="text-muted-foreground max-w-md mx-auto">
								Start managing your product portfolio! Add your
								first product to track tasks, feedback, and
								support metrics.
							</p>
							<Dialog>
								<DialogTrigger asChild>
									<Button className="mt-4">
										Add Your First Product
									</Button>
								</DialogTrigger>
								<DialogContent showCloseButton={true}>
									<DialogHeader>
										<DialogTitle>Add Product</DialogTitle>
										<DialogDescription>
											Create a new product to get started.
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
