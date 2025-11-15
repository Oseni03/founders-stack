import { ProjectStoreProvider } from "@/zustand/providers/project-store-provider";

export default function TasksProjectsLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<>
			<ProjectStoreProvider>{children}</ProjectStoreProvider>
		</>
	);
}
