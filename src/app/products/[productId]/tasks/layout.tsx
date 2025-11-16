import { TasksStoreProvider } from "@/zustand/providers/task-store-provider";

export default function TasksLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<>
			<TasksStoreProvider>{children}</TasksStoreProvider>
		</>
	);
}
