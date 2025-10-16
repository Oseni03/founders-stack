"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
	LineChart,
	Line,
	BarChart,
	Bar,
	PieChart,
	Pie,
	Cell,
	XAxis,
	YAxis,
	CartesianGrid,
	Tooltip,
	Legend,
	ResponsiveContainer,
} from "recharts";
import {
	TrendingUp,
	TrendingDown,
	DollarSign,
	Users,
	AlertCircle,
	CreditCard,
	Calendar,
	RefreshCw,
} from "lucide-react";
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectLabel,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Invoice } from "@prisma/client";
import { useFinanceStore } from "@/zustand/providers/finance-store-provider";
import { formatDate } from "@/lib/date";
import { toast } from "sonner";

// MetricCard component
const MetricCard = ({
	title,
	value,
	change,
	icon: Icon,
	prefix = "",
	suffix = "",
	trend = "up",
}: {
	title: string;
	value: number | string;
	change: number;
	icon: typeof DollarSign;
	prefix?: string;
	suffix?: string;
	trend?: "up" | "down";
}) => {
	const isPositive = change >= 0;
	const TrendIcon = isPositive ? TrendingUp : TrendingDown;

	return (
		<div className="rounded-lg shadow border hover:shadow-md transition-shadow">
			<div className="flex items-center justify-between mb-4 px-6 py-4">
				<div className="rounded-lg">
					<Icon className="w-6 h-6" />
				</div>
				<span className="flex items-center text-sm">
					<TrendIcon className="w-4 h-4 mr-1" />
					{Math.abs(change).toFixed(1)}%
				</span>
			</div>
			<h3 className="text-sm mb-1 px-6">{title}</h3>
			<p className="text-3xl px-6 pb-4">
				{prefix}
				{typeof value === "number" ? value.toLocaleString() : value}
				{suffix}
			</p>
		</div>
	);
};

// InvoiceTable component
const InvoiceTable = ({ invoices }: { invoices: Invoice[] }) => {
	return (
		<div className="rounded-lg shadow border">
			<div className="px-6 py-4 border-b">
				<h3 className="text-lg">Recent Invoices</h3>
			</div>
			<div className="overflow-x-auto">
				<table className="w-full">
					<thead>
						<tr>
							<th className="px-6 py-3 text-left text-xs">SN</th>
							<th className="px-6 py-3 text-left text-xs">
								Customer
							</th>
							<th className="px-6 py-3 text-left text-xs">
								Amount
							</th>
							<th className="px-6 py-3 text-left text-xs">
								Status
							</th>
							<th className="px-6 py-3 text-left text-xs">
								Date
							</th>
						</tr>
					</thead>
					<tbody>
						{invoices.map((invoice, index) => (
							<tr key={invoice.id}>
								<td className="px-6 py-4 text-sm">
									<a
										href={invoice.pdfUrl || "#"}
										target="_blank"
										rel="noopener noreferrer"
										className="hover:underline"
									>
										{index}
									</a>
								</td>
								<td className="px-6 py-4 text-sm">
									{invoice.externalId || "N/A"}
								</td>
								<td className="px-6 py-4 text-sm">
									{new Intl.NumberFormat("en-US", {
										style: "currency",
										currency: "USD",
									}).format(invoice.amountDue)}
								</td>
								<td className="px-6 py-4 text-sm">
									<span className="inline-flex text-xs leading-5 rounded-full">
										{invoice.status}
									</span>
								</td>
								<td className="px-6 py-4 text-sm">
									{formatDate(invoice.issuedDate)}
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>
		</div>
	);
};

export default function FinancePage() {
	const {
		data,
		mrrHistory,
		mrr,
		churnRate,
		paymentFailureRate,
		activeCustomers,
		customerActivity,
		revenueByPlan,
		subscriptionStatus,
		error: stateError,
		syncFinanceData,
	} = useFinanceStore((state) => state);
	const [isRefreshing, setIsRefreshing] = useState(false);
	const [timeRange, setTimeRange] = useState("6m");
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		if (error) {
			toast.error(error);
		}
		if (stateError) {
			toast.error(stateError);
		}
	}, [error, stateError]);

	const handleRefresh = async () => {
		setIsRefreshing(true);
		try {
			await syncFinanceData();
		} catch (err) {
			console.error("Sync failed:", err);
			setError("Failed to sync data. Please try again.");
		} finally {
			setIsRefreshing(false);
		}
	};

	if (error) {
		return (
			<div className="min-h-screen flex items-center justify-center">
				<div className="p-6 rounded-lg shadow border">
					<p className="text-sm mb-4">{error}</p>
					<Button
						onClick={handleRefresh}
						className="flex items-center gap-2 px-4 py-2"
					>
						<RefreshCw className="w-4 h-4" />
						Retry
					</Button>
				</div>
			</div>
		);
	}

	if (data?.notConnected) {
		return (
			<div className="min-h-screen flex items-center justify-center">
				<div className="p-6 rounded-lg shadow border text-center">
					<h2 className="text-xl mb-2">No Stripe Integration</h2>
					<p className="text-sm mb-4">
						Connect your Stripe account to view financial data.
					</p>
					<Link
						href="/dashboard/integrations"
						className="inline-block px-4 py-2 rounded-lg"
					>
						Connect Stripe
					</Link>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen">
			{/* Header */}
			<div className="border-b">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					<div className="flex items-center justify-between h-16">
						<div>
							<h1 className="text-2xl">Financial Overview</h1>
							<p className="text-sm">
								Monitor your key financial metrics
							</p>
						</div>
						<div className="flex items-center gap-3">
							<Select
								value={timeRange}
								onValueChange={(value) => setTimeRange(value)}
							>
								<SelectTrigger className="w-[180px]">
									<SelectValue placeholder="Select a time range" />
								</SelectTrigger>
								<SelectContent>
									<SelectGroup>
										<SelectLabel>Time Range</SelectLabel>
										<SelectItem value="1m">
											Last 30 days
										</SelectItem>
										<SelectItem value="3m">
											Last 3 months
										</SelectItem>
										<SelectItem value="6m">
											Last 6 months
										</SelectItem>
										<SelectItem value="1y">
											Last year
										</SelectItem>
									</SelectGroup>
								</SelectContent>
							</Select>
							<Button
								onClick={handleRefresh}
								disabled={isRefreshing}
								className="flex items-center gap-2 px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
							>
								<RefreshCw
									className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`}
								/>
								Sync
							</Button>
						</div>
					</div>
				</div>
			</div>

			{/* Main Content */}
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
				{/* Key Metrics */}
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
					<MetricCard
						title="Monthly Recurring Revenue"
						value={mrr || 0}
						change={
							mrr
								? ((mrr -
										(mrrHistory[mrrHistory.length - 2]
											?.value || mrr)) /
										(mrrHistory[mrrHistory.length - 2]
											?.value || mrr)) *
									100
								: 0
						}
						icon={DollarSign}
						prefix="$"
						trend="up"
					/>
					<MetricCard
						title="Active Customers"
						value={activeCustomers || 0}
						change={0}
						icon={Users}
						trend="up"
					/>
					<MetricCard
						title="Churn Rate"
						value={churnRate || 0}
						change={0}
						icon={AlertCircle}
						suffix="%"
						trend="down"
					/>
					<MetricCard
						title="Payment Failure Rate"
						value={paymentFailureRate || 0}
						change={0}
						icon={CreditCard}
						suffix="%"
						trend="down"
					/>
				</div>

				{/* Balance Cards */}
				<div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
					<div className="rounded-lg shadow border p-6">
						<div className="flex items-center justify-between mb-4">
							<h3 className="text-sm">Available Balance</h3>
							<DollarSign className="w-5 h-5" />
						</div>
						<p className="text-4xl">
							{data?.balance
								? new Intl.NumberFormat("en-US", {
										style: "currency",
										currency: data.balance.currency,
									}).format(data.balance.availableAmount)
								: "$0"}
						</p>
						<p className="text-sm">Ready for payout</p>
					</div>
					<div className="rounded-lg shadow border p-6">
						<div className="flex items-center justify-between mb-4">
							<h3 className="text-sm">Pending Balance</h3>
							<Calendar className="w-5 h-5" />
						</div>
						<p className="text-4xl">
							{data?.balance
								? new Intl.NumberFormat("en-US", {
										style: "currency",
										currency: data.balance.currency,
									}).format(data.balance.pendingAmount)
								: "$0"}
						</p>
						<p className="text-sm">Processing payments</p>
					</div>
				</div>

				{/* Charts Row */}
				<div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
					{/* MRR Trend */}
					<div className="rounded-lg shadow border p-6">
						<h3 className="text-lg mb-4">MRR Trend</h3>
						<ResponsiveContainer width="100%" height={300}>
							<LineChart data={mrrHistory || []}>
								<CartesianGrid />
								<XAxis dataKey="period" />
								<YAxis />
								<Tooltip />
								<Line type="monotone" dataKey="value" />
							</LineChart>
						</ResponsiveContainer>
					</div>

					{/* Revenue by Plan */}
					<div className="rounded-lg shadow border p-6">
						<h3 className="text-lg mb-4">Revenue by Plan</h3>
						<ResponsiveContainer width="100%" height={300}>
							<PieChart>
								<Pie
									data={revenueByPlan || []}
									cx="50%"
									cy="50%"
									labelLine={false}
									label={({ name, percent }) =>
										`${name}: ${(percent * 100).toFixed(0)}%`
									}
									outerRadius={100}
									dataKey="value"
								/>
								<Tooltip />
							</PieChart>
						</ResponsiveContainer>
					</div>
				</div>

				{/* Bottom Row Charts */}
				<div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
					{/* Customer Activity */}
					<div className="rounded-lg shadow border p-6">
						<h3 className="text-lg mb-4">Customer Activity</h3>
						<ResponsiveContainer width="100%" height={300}>
							<BarChart data={customerActivity || []}>
								<CartesianGrid />
								<XAxis dataKey="month" />
								<YAxis />
								<Tooltip />
								<Legend />
								<Bar dataKey="new" name="New Customers" />
								<Bar dataKey="churned" name="Churned" />
							</BarChart>
						</ResponsiveContainer>
					</div>

					{/* Subscription Status */}
					<div className="rounded-lg shadow border p-6">
						<h3 className="text-lg mb-4">Subscription Status</h3>
						<ResponsiveContainer width="100%" height={300}>
							<PieChart>
								<Pie
									data={subscriptionStatus || []}
									cx="50%"
									cy="50%"
									labelLine={false}
									label={({ name, value }) =>
										`${name}: ${value}`
									}
									outerRadius={100}
									dataKey="value"
								/>
								<Tooltip />
							</PieChart>
						</ResponsiveContainer>
					</div>
				</div>

				{/* Recent Invoices Table */}
				<InvoiceTable invoices={data?.invoices || []} />
			</div>
		</div>
	);
}
