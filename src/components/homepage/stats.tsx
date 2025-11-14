import React from "react";

export const Stats = () => {
	const stats = [
		{ value: "8", label: "Integrated PM Tools" },
		{ value: "5s", label: "Real-Time Sync" },
		{ value: "100%", label: "User Data Privacy" },
	];

	return (
		<section className="border-y border-border bg-muted/30 py-16 animate-fade-in">
			<div className="mx-auto w-full max-w-5xl">
				<div className="grid gap-8 md:grid-cols-3 text-center">
					{stats.map((stat, index) => (
						<div key={index} className="flex flex-col gap-2">
							<div className="text-4xl font-bold tracking-tighter">
								{stat.value}
							</div>
							<div className="text-sm text-muted-foreground uppercase tracking-wide">
								{stat.label}
							</div>
						</div>
					))}
				</div>
			</div>
		</section>
	);
};
