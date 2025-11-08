import { ProjectStoreProvider } from "@/zustand/providers/project-store-provider";

export default function ProjectHealthLayout({
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
