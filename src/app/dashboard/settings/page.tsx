"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";

import { useOrganizationStore } from "@/zustand/providers/organization-store-provider";
import ProjectCard from "@/components/settings/project-card";
import { MembersCard } from "@/components/settings/members-card";

function SettingPage() {
	const {
		activeOrganization,
		members,
		invitations,
		isAdmin,
		removeInvite,
		removeMember: removeMemberState,
		removeOrganization,
	} = useOrganizationStore((state) => state);

	if (!activeOrganization) {
		return (
			<div className="space-y-6">
				<Card>
					<CardContent className="p-6">
						<div className="animate-pulse space-y-2">
							<div className="h-4 bg-gray-200 rounded w-3/4"></div>
							<div className="h-4 bg-gray-200 rounded w-1/2"></div>
							<div className="h-4 bg-gray-200 rounded w-2/3"></div>
						</div>
					</CardContent>
				</Card>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			<ProjectCard
				organization={activeOrganization}
				isAdmin={isAdmin}
				removeOrganization={removeOrganization}
			/>

			<MembersCard
				organization={activeOrganization}
				isAdmin={isAdmin}
				invitations={invitations}
				members={members}
				removeInvite={removeInvite}
				removeMemberState={removeMemberState}
			/>
		</div>
	);
}

export default SettingPage;
