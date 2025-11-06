"use client";

import React from "react";
import { Header } from "@/components/homepage/header";
import { Footer } from "@/components/homepage/footer";

export default function TermsPage() {
	return (
		<div className="flex min-h-screen flex-col bg-background px-4 sm:px-6 lg:px-8">
			<Header />

			<main className="flex-1">
				<div className="mx-auto w-full max-w-7xl py-24">
					<div className="flex flex-col gap-6">
						<h1 className="text-4xl font-bold">Terms of Service</h1>

						<p className="text-lg text-muted-foreground max-w-3xl">
							Welcome to Builders&apos; Stack. By using our
							service, you agree to these terms. Please read them
							carefully as they govern your use of our platform
							and services.
						</p>

						<div className="space-y-6">
							<section>
								<h2 className="text-2xl font-semibold mb-3">
									Service Usage
								</h2>
								<p className="text-muted-foreground">
									Builders&apos; Stack provides a unified
									dashboard and analytics platform. You agree
									to use the service in compliance with
									applicable laws and our acceptable use
									policies.
								</p>
							</section>

							<section>
								<h2 className="text-2xl font-semibold mb-3">
									Data Integration
								</h2>
								<p className="text-muted-foreground">
									By using our service, you grant us
									permission to access and aggregate data from
									your connected services in accordance with
									our privacy policy and the respective terms
									of those services.
								</p>
							</section>

							<section>
								<h2 className="text-2xl font-semibold mb-3">
									Liability
								</h2>
								<p className="text-muted-foreground">
									While we strive for 100% accuracy,
									Builders&apos; Stack is provided &quot;as
									is.&quot; We&apos;re not liable for
									decisions made based on the data or any
									service interruptions.
								</p>
							</section>

							<section>
								<h2 className="text-2xl font-semibold mb-3">
									Updates
								</h2>
								<p className="text-muted-foreground">
									We may update these terms as our service
									evolves. Continued use of Builders&apos;
									Stack after changes constitutes acceptance
									of the updated terms.
								</p>
							</section>
						</div>
					</div>
				</div>
			</main>

			<Footer />
		</div>
	);
}
