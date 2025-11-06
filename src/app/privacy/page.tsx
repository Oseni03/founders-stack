"use client";

import React from "react";
import { Header } from "@/components/homepage/header";
import { Footer } from "@/components/homepage/footer";

export default function PrivacyPage() {
	return (
		<div className="flex min-h-screen flex-col bg-background px-4 sm:px-6 lg:px-8">
			<Header />

			<main className="flex-1">
				<div className="mx-auto w-full max-w-7xl py-24">
					<div className="flex flex-col gap-6">
						<h1 className="text-4xl font-bold">Privacy Policy</h1>

						<p className="text-lg text-muted-foreground max-w-3xl">
							At Builders&apos; Stack, we take your privacy
							seriously. This policy outlines how we collect, use,
							and protect your data when you use our platform and
							its integrated services.
						</p>

						<div className="space-y-6">
							<section>
								<h2 className="text-2xl font-semibold mb-3">
									Data Collection and Usage
								</h2>
								<p className="text-muted-foreground">
									We collect and process data necessary to
									provide our service, including metrics from
									integrated tools, authentication
									information, and usage analytics. This data
									helps us deliver insights and improve your
									experience.
								</p>
							</section>

							<section>
								<h2 className="text-2xl font-semibold mb-3">
									Data Security
								</h2>
								<p className="text-muted-foreground">
									Your data is encrypted in transit and at
									rest. We implement industry-standard
									security measures to protect your
									information and maintain compliance with
									relevant regulations.
								</p>
							</section>

							<section>
								<h2 className="text-2xl font-semibold mb-3">
									Contact Us
								</h2>
								<p className="text-muted-foreground">
									For questions about our privacy practices or
									to exercise your rights regarding your data,
									please reach out to us on X (Twitter) at
									@Oseni03
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
