export const ToolBadge = ({ tool }: { tool: string }) => {
	const colors: { [key: string]: string } = {
		jira: "bg-blue-500",
		linear: "bg-purple-500",
		asana: "bg-pink-500",
	};
	return (
		<span
			className={`${colors[tool]} text-xs px-2 py-0.5 rounded uppercase font-semibold`}
		>
			{tool}
		</span>
	);
};
