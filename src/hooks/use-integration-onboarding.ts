import { Resources } from "@/types/connector";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export function useIntegrationOnboarding() {
	const { tool } = useParams<{ tool: string }>(); // e.g., "github", "asana"
	const router = useRouter();
	const [resources, setResources] = useState<Resources[]>([]);
	const [selectedResources, setSelectedResources] = useState<string[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [dialogOpen, setDialogOpen] = useState(true); // Open dialog by default
	const [searchTerm, setSearchTerm] = useState("");

	// Pagination state
	const [currentPage, setCurrentPage] = useState(1);
	const [totalPages, setTotalPages] = useState(1);
	const [hasMore, setHasMore] = useState(false);
	const [isLoadingMore, setIsLoadingMore] = useState(false);
	const [totalCount, setTotalCount] = useState(0);

	// Fetch available resources based on tool
	const fetchResources = async (page = 1, append = false) => {
		if (append) {
			setIsLoadingMore(true);
		} else {
			setLoading(true);
		}
		try {
			const params = new URLSearchParams({
				page: page.toString(),
				limit: "50",
			});

			// Implementation - only add search param if it has a value
			if (searchTerm && searchTerm.trim()) {
				params.set("search", searchTerm.trim());
			}

			const response = await fetch(
				`/api/integrations/${tool}/resources?${params.toString()}`
			);
			if (!response.ok)
				throw new Error(`Failed to fetch ${tool} resources`);

			const { resources: fetchedResources, pagination } =
				await response.json();

			if (!Array.isArray(fetchedResources)) {
				throw new Error("Invalid response format");
			}

			// Append or replace repos based on pagination
			if (append) {
				setResources((prev) => [...prev, ...fetchedResources]);
			} else {
				setResources(fetchedResources);
			}

			setCurrentPage(pagination.page);
			setTotalPages(pagination.totalPages);
			setHasMore(pagination.hasMore);
			setTotalCount(pagination.total);
		} catch (err) {
			setError(err instanceof Error ? err.message : "An error occurred");
			toast.error(
				err instanceof Error
					? err.message
					: "Failed to load resources. Please try again."
			);
			if (!append) {
				setResources([]);
			}
		} finally {
			setLoading(false);
			setIsLoadingMore(false);
		}
	};

	// Debounced search effect
	useEffect(() => {
		const timeoutId = setTimeout(() => {
			setCurrentPage(1);
			fetchResources(1, false);
		}, 300);

		return () => clearTimeout(timeoutId);
	}, [searchTerm, tool]);

	// Handle selection toggle
	const toggleSelection = (id: string) => {
		setSelectedResources((prev) =>
			prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
		);
	};

	const handleLoadMore = () => {
		if (!hasMore || isLoadingMore) return;
		fetchResources(currentPage + 1, true);
	};

	const handleSave = async () => {
		if (selectedResources.length === 0) return;

		const selected = resources.filter((r) =>
			selectedResources.includes(r.externalId)
		);

		try {
			const response = await fetch(
				`/api/integrations/${tool}/add-resources`,
				{
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						selected,
					}),
				}
			);

			if (!response.ok)
				throw new Error(`Failed to add ${tool} resources`);

			toast.success(`${selected.length} resources added successfully`);

			setDialogOpen(false);
			router.push("/dashboard");
		} catch (error) {
			toast.error(
				error instanceof Error
					? error.message
					: `Failed to add ${tool} resources`
			);
			console.error(`[SAVE_${tool?.toUpperCase()}]`, error);
		}
	};

	// Handle dialog close
	const handleDialogClose = (open: boolean) => {
		setDialogOpen(open);
		if (!open) {
			// Redirect to dashboard if user closes without saving
			router.push("/dashboard");
		}
	};

	return {
		loading,
		error,
		tool,
		dialogOpen,
		totalCount,
		totalPages,
		searchTerm,
		resources,
		hasMore,
		isLoadingMore,
		currentPage,
		selectedResources,
		toggleSelection,
		handleLoadMore,
		handleDialogClose,
		setSearchTerm,
		handleSave,
	};
}
