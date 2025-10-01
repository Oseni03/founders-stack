"use client";

import React from "react";
import { useTheme } from "next-themes";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
	CardDescription,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { PaintBucket, Sun, Moon, Monitor } from "lucide-react";

export const ThemeCard = () => {
	const { theme, setTheme } = useTheme();

	const themeOptions = [
		{
			value: "light",
			label: "Light",
			description: "Clean and bright interface",
			icon: Sun,
		},
		{
			value: "dark",
			label: "Dark",
			description: "Easy on the eyes in low light",
			icon: Moon,
		},
		{
			value: "system",
			label: "System",
			description: "Match your device settings",
			icon: Monitor,
		},
	];
	return (
		<Card>
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					<PaintBucket className="h-4 w-4" />
					Theme & Appearance
				</CardTitle>
				<CardDescription>
					Customize how the application looks and feels.
				</CardDescription>
			</CardHeader>
			<CardContent className="space-y-6">
				{/* Theme Selection */}
				<div className="space-y-4">
					<Label className="text-base font-medium">Theme Mode</Label>
					<RadioGroup
						value={theme}
						onValueChange={setTheme}
						className="grid grid-cols-1 md:grid-cols-3 gap-4"
					>
						{themeOptions.map((option) => {
							const IconComponent = option.icon;
							return (
								<div key={option.value} className="relative">
									<RadioGroupItem
										value={option.value}
										id={option.value}
										className="peer sr-only"
									/>
									<Label
										htmlFor={option.value}
										className="flex flex-col items-center justify-center rounded-lg border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer transition-all"
									>
										<IconComponent className="mb-3 h-6 w-6" />
										<div className="text-center">
											<div className="font-medium">
												{option.label}
											</div>
											<div className="text-xs text-muted-foreground mt-1">
												{option.description}
											</div>
										</div>
									</Label>
								</div>
							);
						})}
					</RadioGroup>
				</div>

				<div className="text-xs text-muted-foreground pt-2">
					Theme changes are applied immediately and saved
					automatically.
				</div>
			</CardContent>
		</Card>
	);
};
