"use client";

import { useMemo } from "react";
import { Plus, GitBranch } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Repository } from "@/types/code";
import { DeleteRepositoryDialog } from "../development/delete-repository-dialog";
import { useIntegrationsStore } from "@/zustand/providers/integrations-store-provider";
import { useRouter } from "next/navigation";

interface RepositoryManagerProps {
	productId: string;
	repositories: Repository[];
	selectedRepositoryId: string;
	onSelectRepository: (repoId: string) => void;
}

export function RepositoryManager({
	productId,
	repositories,
	selectedRepositoryId,
	onSelectRepository,
}: RepositoryManagerProps) {
	const integrations = useIntegrationsStore((state) => state.integrations);
	const router = useRouter();

	const codeIntegrations = useMemo(() => {
		return integrations.filter((item) => item.category === "CODE");
	}, [integrations]);

	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between">
				<h3 className="font-semibold text-foreground">Repositories</h3>
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button size="sm" variant="outline" className="gap-2">
							<Plus className="h-4 w-4" />
							Add
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent>
						{codeIntegrations.map((integration) => (
							<DropdownMenuItem
								key={integration.id}
								onClick={() =>
									router.push(
										`/products/${productId}/integrations/${integration.platform}/onboarding`
									)
								}
							>
								<span>{integration.platform}</span>
							</DropdownMenuItem>
						))}
					</DropdownMenuContent>
				</DropdownMenu>
			</div>

			<div className="space-y-2">
				{repositories.map((repo) => (
					<div
						key={repo.id}
						className={`flex items-center justify-between rounded-lg border p-3 transition-colors ${
							selectedRepositoryId === repo.id
								? "border-primary bg-primary/5"
								: "border-border hover:bg-muted/50"
						}`}
					>
						<button
							onClick={() => onSelectRepository(repo.id)}
							className="flex-1 text-left"
						>
							<div className="flex items-center gap-2">
								<GitBranch className="h-4 w-4 text-muted-foreground" />
								<div>
									<p className="font-medium text-foreground">
										{repo.name}
									</p>
									<p className="text-xs text-muted-foreground">
										{repo.owner} • {repo.language}
									</p>
								</div>
							</div>
						</button>
						<DeleteRepositoryDialog
							productId={productId}
							repository={repo}
						/>
					</div>
				))}
			</div>
		</div>
	);
}
