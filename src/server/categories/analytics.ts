"use server";

import { prisma } from "@/lib/prisma";

export async function getEvents(organizationId: string, startDate: Date) {
	const events = await prisma.analyticsEvent.findMany({
		where: {
			timestamp: {
				gte: startDate,
			},
			organizationId,
		},
		select: {
			id: true,
			sourceTool: true,
			organizationId: true,
			externalId: true,
			eventType: true,
			referrer: true,
			referringDomain: true,
			timezone: true,
			pathname: true,
			deviceType: true,
			browserLanguagePrefix: true,
			geoipCityName: true,
			geoipCountryName: true,
			geoipCountryCode: true,
			geoipContinentName: true,
			geoipContinentCode: true,
			duration: true,
			attributes: true,
			timestamp: true,
			createdAt: true,
			updatedAt: true,
			projectId: true,
		},
	});

	return events;
}
