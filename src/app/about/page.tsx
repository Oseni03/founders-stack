"use client";

import React from "react";
import { Header } from "@/components/homepage/header";
import { Footer } from "@/components/homepage/footer";

export default function AboutPage() {
	return (
		<div className="flex min-h-screen flex-col bg-background px-4 sm:px-6 lg:px-8">
			<Header />

			<main className="flex-1">
				<div className="mx-auto w-full max-w-7xl py-24">
					<div className="flex flex-col gap-6">
						<h1 className="text-4xl font-bold">
							About Builders&apos; Stack
						</h1>
						<p className="text-lg text-muted-foreground max-w-3xl">
							Builders&apos; Stack is your single pane of glass
							for startup success — a powerful dashboard that
							aggregates metrics, alerts, and insights from your
							existing tools so you can focus on what matters
							most: building your product and growing your
							business.
						</p>

						<p className="text-muted-foreground">
							Our mission is to empower indie founders and small
							teams with enterprise-grade management and
							visibility into their entire stack, making it easier
							to make data-driven decisions and stay on top of
							what matters.
						</p>
					</div>
				</div>
			</main>

			<Footer />
		</div>
	);
}
