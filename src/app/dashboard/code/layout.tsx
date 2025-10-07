"use client";

import { useCodeStore } from "@/zustand/providers/code-store-provider";
import { useEffect } from "react";

export default function CodePageLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	const { fetchRepositories } = useCodeStore((state) => state);
	useEffect(() => {
		const fetchRepos = async () => {
			try {
				// Fetch all repositories for the project
				await fetchRepositories();
			} catch (error) {
				console.error("Failed to fetch repositories data:", error);
			}
		};
		fetchRepos();
	}, [fetchRepositories]);
	return <>{children}</>;
}
