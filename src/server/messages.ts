"use server";

import { ChannelData, syncSlack } from "@/lib/connectors/slack";
import { prisma } from "@/lib/prisma";

export async function saveChannels(
	organizationId: string,
	channels: ChannelData[]
) {
	try {
		// Batch upsert using Prisma's $transaction
		const results = await prisma.$transaction(
			channels.map((channel) =>
				prisma.project.upsert({
					where: {
						externalId_sourceTool: {
							externalId: channel.externalId,
							sourceTool: "slack",
						},
					},
					update: {
						name: channel.name,
						description: channel.description,
						attributes: channel.attributes,
					},
					create: {
						organizationId,
						name: channel.name,
						externalId: channel.externalId,
						description: channel.description,
						attributes: channel.attributes,
						sourceTool: "slack",
					},
				})
			)
		);

		await syncSlack(organizationId, results);

		return results; // Return the input repos for chaining or confirmation
	} catch (error) {
		console.error("Failed to save repositories:", error);
		throw new Error("Failed to save repositories due to an internal error");
	}
}
