"use client";

import { useState } from "react";
import { Plus, Trash2, GitBranch } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Repository } from "@/types/code";

interface RepositoryManagerProps {
	repositories: Repository[];
	selectedRepositoryId: string;
	onSelectRepository: (repoId: string) => void;
	onAddRepository: (name: string, owner: string, language: string) => void;
	onDeleteRepository: (repoId: string) => void;
}

export function RepositoryManager({
	repositories,
	selectedRepositoryId,
	onSelectRepository,
	onAddRepository,
	onDeleteRepository,
}: RepositoryManagerProps) {
	const [isAddingRepo, setIsAddingRepo] = useState(false);
	const [newRepoName, setNewRepoName] = useState("");
	const [newRepoOwner, setNewRepoOwner] = useState("");
	const [newRepoLanguage, setNewRepoLanguage] = useState("TypeScript");

	const handleAddRepository = () => {
		if (newRepoName.trim() && newRepoOwner.trim()) {
			onAddRepository(newRepoName, newRepoOwner, newRepoLanguage);
			setNewRepoName("");
			setNewRepoOwner("");
			setNewRepoLanguage("TypeScript");
			setIsAddingRepo(false);
		}
	};

	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between">
				<h3 className="font-semibold text-foreground">Repositories</h3>
				<Button
					size="sm"
					variant="outline"
					onClick={() => setIsAddingRepo(!isAddingRepo)}
					className="gap-2"
				>
					<Plus className="h-4 w-4" />
					Add
				</Button>
			</div>

			{isAddingRepo && (
				<Card className="p-4">
					<div className="space-y-3">
						<Input
							placeholder="Repository name"
							value={newRepoName}
							onChange={(e) => setNewRepoName(e.target.value)}
							className="text-sm"
						/>
						<Input
							placeholder="Owner/Organization"
							value={newRepoOwner}
							onChange={(e) => setNewRepoOwner(e.target.value)}
							className="text-sm"
						/>
						<Select
							value={newRepoLanguage}
							onValueChange={setNewRepoLanguage}
						>
							<SelectTrigger className="w-full">
								<SelectValue placeholder="Select a language" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="TypeScript">
									TypeScript
								</SelectItem>
								<SelectItem value="JavaScript">
									JavaScript
								</SelectItem>
								<SelectItem value="Python">Python</SelectItem>
								<SelectItem value="Go">Go</SelectItem>
								<SelectItem value="Rust">Rust</SelectItem>
								<SelectItem value="Java">Java</SelectItem>
							</SelectContent>
						</Select>
						<div className="flex gap-2">
							<Button
								size="sm"
								onClick={handleAddRepository}
								className="flex-1"
							>
								Create
							</Button>
							<Button
								size="sm"
								variant="outline"
								onClick={() => setIsAddingRepo(false)}
								className="flex-1"
							>
								Cancel
							</Button>
						</div>
					</div>
				</Card>
			)}

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
						<Button
							size="sm"
							variant="ghost"
							onClick={() => onDeleteRepository(repo.id)}
							className="h-8 w-8 p-0"
						>
							<Trash2 className="h-4 w-4 text-destructive" />
						</Button>
					</div>
				))}
			</div>
		</div>
	);
}
