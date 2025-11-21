import { GlassCard } from "@/components/dashboard/glass-card";
import { CustomerPains } from "@/components/dashboard/customer-pains";
import { SprintHealth } from "@/components/dashboard/sprint-health";
import { ShippedFeatures } from "@/components/dashboard/shipped-features";
import { BacklogList } from "@/components/dashboard/backlog-list";
import { Zap, RefreshCw, FileText, Loader2 } from "lucide-react";
import { useState } from "react";
import { useProductStore } from "@/zustand/providers/product-store-provider";

export function Dashboard() {
	const { refreshDashboard, isRefreshing, generateDiagnosis, lastSyncTime } =
		useProductStore((state) => state);
	const [showDiagnosisModal, setShowDiagnosisModal] = useState(false);
	const [diagnosis, setDiagnosis] = useState("");
	const [isGenerating, setIsGenerating] = useState(false);

	const handleDiagnosis = async () => {
		setIsGenerating(true);
		setShowDiagnosisModal(true);
		const result = await generateDiagnosis();
		setDiagnosis(result);
		setIsGenerating(false);
	};

	const formatLastSync = () => {
		const seconds = Math.floor((Date.now() - lastSyncTime) / 1000);
		if (seconds < 60) return "Just now";
		if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
		return `${Math.floor(seconds / 3600)}h ago`;
	};

	return (
		<>
			<header className="flex items-center justify-between mb-8">
				<div>
					<h1 className="text-3xl font-display font-bold text-white mb-2">
						Today in Product
					</h1>
					<p className="text-muted-foreground">
						{new Date().toLocaleDateString("en-US", {
							month: "long",
							day: "numeric",
							year: "numeric",
						})}{" "}
						• Sprint 42
					</p>
				</div>
				<div className="flex items-center gap-4">
					<button
						onClick={refreshDashboard}
						disabled={isRefreshing}
						className="text-xs text-muted-foreground hover:text-white transition-colors flex items-center gap-2"
					>
						<RefreshCw
							size={12}
							className={isRefreshing ? "animate-spin" : ""}
						/>
						Last synced {formatLastSync()}
					</button>
					<div className="flex items-center gap-2">
						<span className="flex h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>
						<span className="text-xs text-green-400 font-mono">
							LIVE UPDATES
						</span>
					</div>
				</div>
			</header>

			<div className="space-y-6">
				<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
					<div className="space-y-6 lg:col-span-1">
						<GlassCard
							title="Top 5 Customer Pains"
							className="h-full min-h-[500px]"
							action={
								<RefreshCw
									size={16}
									className={`text-muted-foreground hover:text-white cursor-pointer transition-colors ${isRefreshing ? "animate-spin" : ""}`}
									onClick={refreshDashboard}
								/>
							}
						>
							<CustomerPains />
						</GlassCard>
					</div>

					<div className="space-y-6 lg:col-span-1 flex flex-col">
						<GlassCard
							title="Sprint Velocity Health"
							delay={0.1}
							className="flex-1"
						>
							<SprintHealth />
						</GlassCard>

						<div className="grid grid-cols-2 gap-4 mt-auto">
							<button
								onClick={handleDiagnosis}
								className="p-4 rounded-2xl bg-primary/10 border border-primary/20 hover:bg-primary/20 transition-all text-left group"
							>
								<div className="bg-primary/20 w-10 h-10 rounded-lg flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
									<Zap className="text-primary" size={20} />
								</div>
								<h4 className="font-bold text-white text-sm">
									Why are we slow?
								</h4>
								<p className="text-xs text-muted-foreground mt-1">
									One-click diagnosis
								</p>
							</button>
							<button className="p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-left group">
								<div className="bg-white/10 w-10 h-10 rounded-lg flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
									<FileText
										className="text-white"
										size={20}
									/>
								</div>
								<h4 className="font-bold text-white text-sm">
									Draft Update
								</h4>
								<p className="text-xs text-muted-foreground mt-1">
									Generate changelog
								</p>
							</button>
						</div>
					</div>

					<div className="space-y-6 lg:col-span-1">
						<GlassCard
							title="Proposed Backlog"
							delay={0.3}
							className="h-full border-primary/20 bg-gradient-to-b from-primary/5 to-transparent"
							action={
								<div className="text-xs bg-primary/20 text-primary px-2 py-1 rounded">
									AI Generated
								</div>
							}
						>
							<BacklogList />
						</GlassCard>
					</div>
				</div>

				<div className="w-full">
					<GlassCard
						title="Shipped Last 7 Days"
						delay={0.2}
						className="w-full"
					>
						<ShippedFeatures />
					</GlassCard>
				</div>
			</div>

			{/* Diagnosis Modal */}
			{showDiagnosisModal && (
				<div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
					<div className="bg-black/90 border border-white/10 rounded-2xl max-w-2xl w-full p-6 shadow-2xl">
						<div className="flex items-center justify-between mb-4">
							<h3 className="text-xl font-display font-bold text-white">
								Sprint Velocity Diagnosis
							</h3>
							<button
								onClick={() => setShowDiagnosisModal(false)}
								className="text-muted-foreground hover:text-white"
							>
								✕
							</button>
						</div>

						{isGenerating ? (
							<div className="flex items-center justify-center py-12">
								<Loader2
									className="animate-spin text-primary"
									size={32}
								/>
								<span className="ml-3 text-muted-foreground">
									Analyzing sprint data...
								</span>
							</div>
						) : (
							<div className="prose prose-invert max-w-none">
								<pre className="whitespace-pre-wrap text-sm text-gray-300 leading-relaxed">
									{diagnosis}
								</pre>
							</div>
						)}
					</div>
				</div>
			)}
		</>
	);
}
