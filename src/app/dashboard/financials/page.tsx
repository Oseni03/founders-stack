"use client";

import { useState } from "react";
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
	const trendColor =
		trend === "up"
			? isPositive
				? "text-green-600"
				: "text-red-600"
			: isPositive
				? "text-red-600"
				: "text-green-600";
	const TrendIcon = isPositive ? TrendingUp : TrendingDown;

	return (
		<div className="bg-white rounded-lg shadow p-6 border border-gray-200 hover:shadow-md transition-shadow">
			<div className="flex items-center justify-between mb-4">
				<div className="p-2 bg-blue-50 rounded-lg">
					<Icon className="w-6 h-6 text-blue-600" />
				</div>
				<span
					className={`flex items-center text-sm font-medium ${trendColor}`}
				>
					<TrendIcon className="w-4 h-4 mr-1" />
					{Math.abs(change).toFixed(1)}%
				</span>
			</div>
			<h3 className="text-gray-600 text-sm font-medium mb-1">{title}</h3>
			<p className="text-3xl font-bold text-gray-900">
				{prefix}
				{typeof value === "number" ? value.toLocaleString() : value}
				{suffix}
			</p>
		</div>
	);
};

// InvoiceTable component
const InvoiceTable = ({ invoices }: { invoices: Invoice[] }) => {
	const getStatusColor = (status: string) => {
		switch (status.toLowerCase()) {
			case "paid":
				return "bg-green-100 text-green-800";
			case "open":
			case "failed":
				return "bg-red-100 text-red-800";
			case "pending":
			case "draft":
				return "bg-yellow-100 text-yellow-800";
			default:
				return "bg-gray-100 text-gray-800";
		}
	};

	return (
		<div className="bg-white rounded-lg shadow border border-gray-200">
			<div className="px-6 py-4 border-b border-gray-200">
				<h3 className="text-lg font-semibold text-gray-900">
					Recent Invoices
				</h3>
			</div>
			<div className="overflow-x-auto">
				<table className="w-full">
					<thead className="bg-gray-50">
						<tr>
							<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
								SN
							</th>
							<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
								Customer
							</th>
							<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
								Amount
							</th>
							<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
								Status
							</th>
							<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
								Date
							</th>
						</tr>
					</thead>
					<tbody className="bg-white divide-y divide-gray-200">
						{invoices.map((invoice, index) => (
							<tr key={invoice.id} className="hover:bg-gray-50">
								<td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
									<a
										href={invoice.pdfUrl || "#"}
										target="_blank"
										rel="noopener noreferrer"
										className="hover:underline"
									>
										{index}
									</a>
								</td>
								<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
									{invoice.customerId || "N/A"}
								</td>
								<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold">
									{new Intl.NumberFormat("en-US", {
										style: "currency",
										currency: "USD",
									}).format(invoice.amountDue)}
								</td>
								<td className="px-6 py-4 whitespace-nowrap">
									<span
										className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(invoice.status)}`}
									>
										{invoice.status}
									</span>
								</td>
								<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
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
		syncFinanceData,
	} = useFinanceStore((state) => state);
	const [isRefreshing, setIsRefreshing] = useState(false);
	const [timeRange, setTimeRange] = useState("6m");
	const [error, setError] = useState<string | null>(null);

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
					<p className="mb-4">{error}</p>
					<Button
						onClick={handleRefresh}
						className="flex items-center gap-2 px-4 py-2 rounded-lg"
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
			<div className="min-h-screen bg-gray-50 flex items-center justify-center">
				<div className="bg-white p-6 rounded-lg shadow border border-gray-200 text-center">
					<h2 className="text-xl font-semibold text-gray-900 mb-2">
						No Stripe Integration
					</h2>
					<p className="text-gray-600 mb-4">
						Connect your Stripe account to view financial data.
					</p>
					<Link
						href="/dashboard/integrations"
						className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
					>
						Connect Stripe
					</Link>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-gray-50">
			{/* Header */}
			<div className="bg-white border-b border-gray-200 sticky top-0 z-10">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					<div className="flex items-center justify-between h-16">
						<div>
							<h1 className="text-2xl font-bold text-gray-900">
								Financial Overview
							</h1>
							<p className="text-sm text-gray-600 mt-1">
								Monitor your key financial metrics
							</p>
						</div>
						<div className="flex items-center gap-3">
							<Select
								value={timeRange}
								onValueChange={(value) => setTimeRange(value)}
							>
								<SelectTrigger className="w-[180px]">
									<SelectValue placeholder="Select a fruit" />
								</SelectTrigger>
								<SelectContent>
									<SelectGroup>
										<SelectLabel>Fruits</SelectLabel>
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
								className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
						change={0} // Placeholder: Compute from events if needed
						icon={Users}
						trend="up"
					/>
					<MetricCard
						title="Churn Rate"
						value={churnRate || 0}
						change={0} // Placeholder: Compute trend if needed
						icon={AlertCircle}
						suffix="%"
						trend="down"
					/>
					<MetricCard
						title="Payment Failure Rate"
						value={paymentFailureRate || 0}
						change={0} // Placeholder: Compute trend if needed
						icon={CreditCard}
						suffix="%"
						trend="down"
					/>
				</div>

				{/* Balance Cards */}
				<div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
					<div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow p-6 text-white">
						<div className="flex items-center justify-between mb-4">
							<h3 className="text-sm font-medium opacity-90">
								Available Balance
							</h3>
							<DollarSign className="w-5 h-5 opacity-75" />
						</div>
						<p className="text-4xl font-bold mb-2">
							{data?.balance
								? new Intl.NumberFormat("en-US", {
										style: "currency",
										currency: data.balance.currency,
									}).format(data.balance.availableAmount)
								: "$0"}
						</p>
						<p className="text-sm opacity-75">Ready for payout</p>
					</div>
					<div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg shadow p-6 text-white">
						<div className="flex items-center justify-between mb-4">
							<h3 className="text-sm font-medium opacity-90">
								Pending Balance
							</h3>
							<Calendar className="w-5 h-5 opacity-75" />
						</div>
						<p className="text-4xl font-bold mb-2">
							{data?.balance
								? new Intl.NumberFormat("en-US", {
										style: "currency",
										currency: data.balance.currency,
									}).format(data.balance.pendingAmount)
								: "$0"}
						</p>
						<p className="text-sm opacity-75">
							Processing payments
						</p>
					</div>
				</div>

				{/* Charts Row */}
				<div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
					{/* MRR Trend */}
					<div className="bg-white rounded-lg shadow p-6 border border-gray-200">
						<h3 className="text-lg font-semibold text-gray-900 mb-4">
							MRR Trend
						</h3>
						<ResponsiveContainer width="100%" height={300}>
							<LineChart data={mrrHistory || []}>
								<CartesianGrid
									strokeDasharray="3 3"
									stroke="#e5e7eb"
								/>
								<XAxis dataKey="period" stroke="#6b7280" />
								<YAxis stroke="#6b7280" />
								<Tooltip
									contentStyle={{
										backgroundColor: "#fff",
										border: "1px solid #e5e7eb",
										borderRadius: "8px",
									}}
									formatter={(value: number) =>
										new Intl.NumberFormat("en-US", {
											style: "currency",
											currency: "USD",
										}).format(value)
									}
								/>
								<Line
									type="monotone"
									dataKey="value"
									stroke="#3b82f6"
									strokeWidth={3}
									dot={{ fill: "#3b82f6", r: 4 }}
								/>
							</LineChart>
						</ResponsiveContainer>
					</div>

					{/* Revenue by Plan */}
					<div className="bg-white rounded-lg shadow p-6 border border-gray-200">
						<h3 className="text-lg font-semibold text-gray-900 mb-4">
							Revenue by Plan
						</h3>
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
								>
									{revenueByPlan.map((entry, index) => (
										<Cell
											key={`cell-${index}`}
											fill={entry.color}
										/>
									))}
								</Pie>
								<Tooltip
									formatter={(value: number) =>
										new Intl.NumberFormat("en-US", {
											style: "currency",
											currency: "USD",
										}).format(value)
									}
								/>
							</PieChart>
						</ResponsiveContainer>
					</div>
				</div>

				{/* Bottom Row Charts */}
				<div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
					{/* Customer Activity */}
					<div className="bg-white rounded-lg shadow p-6 border border-gray-200">
						<h3 className="text-lg font-semibold text-gray-900 mb-4">
							Customer Activity
						</h3>
						<ResponsiveContainer width="100%" height={300}>
							<BarChart data={customerActivity || []}>
								<CartesianGrid
									strokeDasharray="3 3"
									stroke="#e5e7eb"
								/>
								<XAxis dataKey="month" stroke="#6b7280" />
								<YAxis stroke="#6b7280" />
								<Tooltip
									contentStyle={{
										backgroundColor: "#fff",
										border: "1px solid #e5e7eb",
										borderRadius: "8px",
									}}
								/>
								<Legend />
								<Bar
									dataKey="new"
									fill="#10b981"
									name="New Customers"
									radius={[8, 8, 0, 0]}
								/>
								<Bar
									dataKey="churned"
									fill="#ef4444"
									name="Churned"
									radius={[8, 8, 0, 0]}
								/>
							</BarChart>
						</ResponsiveContainer>
					</div>

					{/* Subscription Status */}
					<div className="bg-white rounded-lg shadow p-6 border border-gray-200">
						<h3 className="text-lg font-semibold text-gray-900 mb-4">
							Subscription Status
						</h3>
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
								>
									{subscriptionStatus.map((entry, index) => (
										<Cell
											key={`cell-${index}`}
											fill={entry.color}
										/>
									))}
								</Pie>
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
