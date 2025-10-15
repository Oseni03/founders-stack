"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProfileSettings } from "@/components/settings/profile-settings";
import { NotificationSettings } from "@/components/settings/notification-settings";
import { IntegrationSettings } from "@/components/settings/integration-settings";
import { ApiKeySettings } from "@/components/settings/api-key-settings";
import { PreferenceSettings } from "@/components/settings/preference-settings";
import { DataPrivacySettings } from "@/components/settings/data-privacy-settings";

export default function SettingsPage() {
	const [activeTab, setActiveTab] = useState("profile");

	return (
		<div className="p-4 md:p-6 lg:p-8">
			<div className="mb-8">
				<h1 className="text-3xl font-bold tracking-tight text-balance mb-2">
					Settings
				</h1>
				<p className="text-muted-foreground text-balance">
					Manage your account settings and preferences
				</p>
			</div>

			<Tabs
				value={activeTab}
				onValueChange={setActiveTab}
				className="space-y-6"
			>
				<TabsList className="grid w-full grid-cols-2 lg:grid-cols-6">
					<TabsTrigger value="profile">Profile</TabsTrigger>
					<TabsTrigger value="notifications">
						Notifications
					</TabsTrigger>
					<TabsTrigger value="integrations">Integrations</TabsTrigger>
					<TabsTrigger value="api-keys">API Keys</TabsTrigger>
					<TabsTrigger value="preferences">Preferences</TabsTrigger>
					<TabsTrigger value="data-privacy">
						Data & Privacy
					</TabsTrigger>
				</TabsList>

				<TabsContent value="profile">
					<ProfileSettings />
				</TabsContent>

				<TabsContent value="notifications">
					<NotificationSettings />
				</TabsContent>

				<TabsContent value="integrations">
					<IntegrationSettings />
				</TabsContent>

				<TabsContent value="api-keys">
					<ApiKeySettings />
				</TabsContent>

				<TabsContent value="preferences">
					<PreferenceSettings />
				</TabsContent>

				<TabsContent value="data-privacy">
					<DataPrivacySettings />
				</TabsContent>
			</Tabs>
		</div>
	);
}
