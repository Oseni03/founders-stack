"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
	CommandDialog,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
	CommandSeparator,
} from "@/components/ui/command";
import { Button } from "@/components/ui/button";
import {
	Search,
	FileText,
	DollarSign,
	GitCommit,
	MessageSquare,
	BarChart3,
	AlertCircle,
	Clock,
	Loader2,
} from "lucide-react";
import { useSearchStore } from "@/zustand/providers/search-store-provider";

interface SearchResult {
	id: string;
	type:
		| "task"
		| "transaction"
		| "commit"
		| "message"
		| "ticket"
		| "analytics";
	title: string;
	description: string;
	url: string;
	metadata?: Record<string, JSON>;
}

interface GroupedResults {
	tasks: SearchResult[];
	transactions: SearchResult[];
	commits: SearchResult[];
	messages: SearchResult[];
	tickets: SearchResult[];
	analytics: SearchResult[];
}

const CATEGORY_CONFIG = {
	tasks: { icon: FileText, label: "Tasks", color: "text-blue-500" },
	transactions: {
		icon: DollarSign,
		label: "Transactions",
		color: "text-green-500",
	},
	commits: { icon: GitCommit, label: "Commits", color: "text-purple-500" },
	messages: {
		icon: MessageSquare,
		label: "Messages",
		color: "text-orange-500",
	},
	tickets: {
		icon: AlertCircle,
		label: "Support Tickets",
		color: "text-red-500",
	},
	analytics: { icon: BarChart3, label: "Analytics", color: "text-cyan-500" },
};

export function GlobalSearch() {
	const { recentSearches, addQuery } = useSearchStore((state) => state);
	const router = useRouter();
	const [open, setOpen] = useState(false);
	const [query, setQuery] = useState("");
	const [results, setResults] = useState<GroupedResults>({
		tasks: [],
		transactions: [],
		commits: [],
		messages: [],
		tickets: [],
		analytics: [],
	});
	const [isSearching, setIsSearching] = useState(false);

	// Keyboard shortcut (Cmd+K / Ctrl+K)
	useEffect(() => {
		const down = (e: KeyboardEvent) => {
			if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
				e.preventDefault();
				setOpen((open) => !open);
			}
		};

		document.addEventListener("keydown", down);
		return () => document.removeEventListener("keydown", down);
	}, []);

	// Debounced search
	useEffect(() => {
		if (!query || query.length < 2) {
			setResults({
				tasks: [],
				transactions: [],
				commits: [],
				messages: [],
				tickets: [],
				analytics: [],
			});
			return;
		}

		const timeoutId = setTimeout(() => {
			performSearch(query);
		}, 300);

		return () => clearTimeout(timeoutId);
	}, [query]);

	const performSearch = async (searchQuery: string) => {
		setIsSearching(true);
		try {
			const response = await fetch(
				`/api/search?q=${encodeURIComponent(searchQuery)}`
			);
			if (response.ok) {
				const data = await response.json();
				setResults(data.results);
			}
		} catch (error) {
			console.error("[v0] Search failed:", error);
		} finally {
			setIsSearching(false);
		}
	};

	const handleSelectResult = (result: SearchResult) => {
		addQuery(query);
		setOpen(false);
		setQuery("");
		router.push(result.url);
	};

	const handleSelectRecentSearch = (searchQuery: string) => {
		setQuery(searchQuery);
	};

	const totalResults = Object.values(results).reduce(
		(sum, arr) => sum + arr.length,
		0
	);

	return (
		<>
			<Button
				variant="outline"
				className="relative w-full justify-start text-sm text-muted-foreground sm:pr-12 md:w-40 lg:w-64 bg-transparent"
				onClick={() => setOpen(true)}
			>
				<Search className="mr-2 h-4 w-4" />
				<span className="hidden lg:inline-flex">
					Search everything...
				</span>
				<span className="inline-flex lg:hidden">Search...</span>
				<kbd className="pointer-events-none absolute right-1.5 top-2 hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
					<span className="text-xs">⌘</span>K
				</kbd>
			</Button>

			<CommandDialog open={open} onOpenChange={setOpen}>
				<CommandInput
					placeholder="Search tasks, transactions, commits..."
					value={query}
					onValueChange={setQuery}
				/>
				<CommandList>
					{!query && recentSearches.length > 0 && (
						<>
							<CommandGroup heading="Recent Searches">
								{recentSearches.map((search, index) => (
									<CommandItem
										key={index}
										onSelect={() =>
											handleSelectRecentSearch(search)
										}
									>
										<Clock className="mr-2 h-4 w-4 text-muted-foreground" />
										<span>{search}</span>
									</CommandItem>
								))}
							</CommandGroup>
							<CommandSeparator />
						</>
					)}

					{isSearching && (
						<div className="flex items-center justify-center py-6">
							<Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
						</div>
					)}

					{!isSearching && query && totalResults === 0 && (
						<CommandEmpty>
							{`No results found for "{${query}}"`}
						</CommandEmpty>
					)}

					{!isSearching &&
						query &&
						(
							Object.entries(results) as [
								keyof GroupedResults,
								SearchResult[],
							][]
						).map(
							([category, items]) =>
								items.length > 0 && (
									<CommandGroup
										key={category}
										heading={
											CATEGORY_CONFIG[category].label
										}
									>
										{items.map((result) => {
											const Icon =
												CATEGORY_CONFIG[category].icon;
											return (
												<CommandItem
													key={result.id}
													onSelect={() =>
														handleSelectResult(
															result
														)
													}
												>
													<Icon
														className={`mr-2 h-4 w-4 ${CATEGORY_CONFIG[category].color}`}
													/>
													<div className="flex-1 min-w-0">
														<div className="font-medium truncate">
															{result.title}
														</div>
														<div className="text-xs text-muted-foreground truncate">
															{result.description}
														</div>
													</div>
												</CommandItem>
											);
										})}
									</CommandGroup>
								)
						)}
				</CommandList>
			</CommandDialog>
		</>
	);
}
