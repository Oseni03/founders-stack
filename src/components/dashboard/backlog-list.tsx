import {
	GripVertical,
	ArrowUpRight,
	DollarSign,
	Clock,
	Loader2,
	ArrowUp,
	ArrowDown,
} from "lucide-react";
import { Reorder } from "framer-motion";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { Button } from "../ui/button";
import { useProductStore } from "@/zustand/providers/product-store-provider";

export function BacklogList() {
	const { backlog, reorderBacklog, pushToLinear, isLoading } =
		useProductStore((state) => state);
	const [localItems, setLocalItems] = useState(backlog);
	const [isPushing, setIsPushing] = useState(false);

	const handleReorder = (newOrder: typeof backlog) => {
		setLocalItems(newOrder);
		reorderBacklog(newOrder);
	};

	const handlePush = async () => {
		setIsPushing(true);
		await pushToLinear();
		setIsPushing(false);
	};

	const getMovementIndicator = (item: (typeof backlog)[0]) => {
		if (!item.previousRank || !item.rank) return null;
		const delta = item.previousRank - item.rank;
		if (delta === 0) return null;
		if (delta > 0) return <ArrowUp size={12} className="text-green-400" />;
		return <ArrowDown size={12} className="text-red-400" />;
	};

	return (
		<div className="space-y-6">
			<div className="space-y-1">
				<Reorder.Group
					axis="y"
					values={localItems}
					onReorder={handleReorder}
					className="space-y-2"
				>
					{localItems.map((item) => (
						<Reorder.Item key={item.id} value={item}>
							<div className="group flex items-center gap-3 bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/20 p-3 rounded-xl transition-colors cursor-grab active:cursor-grabbing">
								<GripVertical
									className="text-muted-foreground/50 group-hover:text-muted-foreground"
									size={16}
								/>

								<div className="flex-1 min-w-0">
									<div className="flex items-center gap-2 mb-1">
										{getMovementIndicator(item)}
										<span className="text-sm font-medium text-white truncate">
											{item.title}
										</span>
										<span
											className={cn(
												"text-[10px] px-1.5 py-0.5 rounded border",
												item.tag === "High" &&
													"bg-red-500/10 text-red-400 border-red-500/20",
												item.tag === "Feat" &&
													"bg-blue-500/10 text-blue-400 border-blue-500/20",
												item.tag === "UX" &&
													"bg-purple-500/10 text-purple-400 border-purple-500/20",
												item.tag === "Maint" &&
													"bg-gray-500/10 text-gray-400 border-gray-500/20"
											)}
										>
											{item.tag}
										</span>
									</div>

									<div className="flex items-center gap-4 text-xs text-muted-foreground">
										<div className="flex items-center gap-1">
											<span className="font-bold text-white">
												{item.pain}
											</span>{" "}
											Pain
										</div>
										<div className="flex items-center gap-1">
											<Clock size={12} />
											<span>{item.effort}</span>
										</div>
										{item.revenue !== "$0" && (
											<div className="flex items-center gap-1 text-green-400">
												<DollarSign size={12} />
												<span>{item.revenue}</span>{" "}
												exposure
											</div>
										)}
									</div>
								</div>

								<div className="opacity-0 group-hover:opacity-100 transition-opacity">
									<ArrowUpRight
										size={16}
										className="text-muted-foreground hover:text-white"
									/>
								</div>
							</div>
						</Reorder.Item>
					))}
				</Reorder.Group>
			</div>

			<Button
				onClick={handlePush}
				disabled={isPushing || isLoading}
				className="w-full py-4 rounded-xl bg-green-500 hover:bg-green-400 text-black font-bold transition-all shadow-lg shadow-green-500/20 hover:shadow-green-500/40 transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
			>
				{isPushing && <Loader2 className="animate-spin" size={20} />}
				{isPushing ? "Pushing to Linear..." : "Push to Linear"}
			</Button>
		</div>
	);
}
