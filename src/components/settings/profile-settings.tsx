"use client";

import { useState } from "react";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Upload, Loader2 } from "lucide-react";
import { toast } from "sonner";

export function ProfileSettings() {
	const [isLoading, setIsLoading] = useState(false);
	const [profile, setProfile] = useState({
		name: "John Doe",
		email: "john@example.com",
		company: "Acme Inc",
		bio: "Founder & CEO building the next big thing",
		avatar: "",
	});

	const handleSave = async () => {
		setIsLoading(true);
		try {
			const response = await fetch("/api/settings/profile", {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(profile),
			});

			if (response.ok) {
				toast.success("Profile updated", {
					description: "Your profile has been successfully updated.",
				});
			} else {
				throw new Error("Failed to update profile");
			}
		} catch (error) {
			console.log("Profile update error:", error);
			toast.error("Error", {
				description: "Failed to update profile. Please try again.",
			});
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<div className="space-y-6">
			<Card>
				<CardHeader>
					<CardTitle>Profile Information</CardTitle>
					<CardDescription>
						Update your personal information and profile picture
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-6">
					<div className="flex items-center gap-6">
						<Avatar className="h-20 w-20">
							<AvatarImage
								src={profile.avatar || "/placeholder.svg"}
							/>
							<AvatarFallback className="text-lg">
								{profile.name
									.split(" ")
									.map((n) => n[0])
									.join("")}
							</AvatarFallback>
						</Avatar>
						<div>
							<Button
								variant="outline"
								size="sm"
								className="gap-2 bg-transparent"
							>
								<Upload className="h-4 w-4" />
								Upload Photo
							</Button>
							<p className="text-xs text-muted-foreground mt-2">
								JPG, PNG or GIF. Max 2MB.
							</p>
						</div>
					</div>

					<div className="grid gap-4 md:grid-cols-2">
						<div className="space-y-2">
							<Label htmlFor="name">Full Name</Label>
							<Input
								id="name"
								value={profile.name}
								onChange={(e) =>
									setProfile({
										...profile,
										name: e.target.value,
									})
								}
							/>
						</div>

						<div className="space-y-2">
							<Label htmlFor="email">Email</Label>
							<Input
								id="email"
								type="email"
								value={profile.email}
								onChange={(e) =>
									setProfile({
										...profile,
										email: e.target.value,
									})
								}
							/>
						</div>
					</div>

					<div className="space-y-2">
						<Label htmlFor="company">Company</Label>
						<Input
							id="company"
							value={profile.company}
							onChange={(e) =>
								setProfile({
									...profile,
									company: e.target.value,
								})
							}
						/>
					</div>

					<div className="space-y-2">
						<Label htmlFor="bio">Bio</Label>
						<Textarea
							id="bio"
							rows={4}
							value={profile.bio}
							onChange={(e) =>
								setProfile({ ...profile, bio: e.target.value })
							}
							placeholder="Tell us about yourself..."
						/>
					</div>

					<div className="flex justify-end gap-2">
						<Button variant="outline">Cancel</Button>
						<Button onClick={handleSave} disabled={isLoading}>
							{isLoading && (
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
							)}
							Save Changes
						</Button>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
