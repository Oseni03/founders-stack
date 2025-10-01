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
		description: "Perfect for small teams getting started",
		price: "$0",
		period: "/month",
		maxUsers: 3,
		maxNotes: 50,
		icon: Building2,
		features: ["3 users", "50 notes"],
		popular: false,
		productId: process.env.NEXT_PUBLIC_FREE_PLAN_ID || "",
	},
	{
		id: "pro",
		name: "Pro",
		description: "Advanced features for large organizations",
		price: "$19",
		period: "/month",
		maxUsers: 1,
		maxNotes: 1,
		icon: Zap,
		features: ["Unlimited users", "Unlimited notes"],
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
