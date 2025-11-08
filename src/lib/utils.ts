import slugify from "@sindresorhus/slugify";
import { clsx, type ClassValue } from "clsx";
import { Building2, Zap } from "lucide-react";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export const SUBSCRIPTION_PLANS = [
	{
		id: "free",
		name: "Free",
		description: "Perfect for indie founders getting started",
		price: "$0",
		period: "/month",
		maxIntegrations: 3,
		icon: Building2,
		features: [
			"3 tool integrations",
			"Basic metrics dashboard",
			"Daily data sync",
			"Email alerts",
		],
		popular: false,
		productId: process.env.NEXT_PUBLIC_FREE_PLAN_ID || "",
	},
	{
		id: "pro",
		name: "Pro",
		description: "Advanced features for growing startups",
		price: "$29",
		period: "/month",
		maxIntegrations: -1,
		icon: Zap,
		features: [
			"Unlimited integrations",
			"Custom dashboards",
			"Real-time sync",
			"Advanced analytics",
			"API access",
			"Priority support",
		],
		popular: true,
		productId: process.env.NEXT_PUBLIC_PRO_PLAN_ID || "",
	},
];

export const FREE_PLAN = SUBSCRIPTION_PLANS.at(0);

export const getPlan = (planId: string) => {
	return SUBSCRIPTION_PLANS.find((plan) => plan.id === planId);
};

export const getPlanByProductId = (productId: string) => {
	return (
		SUBSCRIPTION_PLANS.find((plan) => plan.productId === productId) ||
		FREE_PLAN
	);
};

export const generateWebhookUrl = (
	organizationId: string,
	toolName: string
) => {
	const webhookUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/${toolName}/${organizationId}`;
	return webhookUrl;
};

export const generateSlug = (text: string) => {
	return slugify(text);
};
