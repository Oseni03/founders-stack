import { betterAuth } from "better-auth";
import { nextCookies } from "better-auth/next-js";
import { customSession, organization, magicLink } from "better-auth/plugins";
import { admin, member } from "./auth/permissions";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "./prisma";
import {
	createOrganization,
	getActiveOrganization,
} from "@/server/organizations";
import { polar, checkout, portal, webhooks } from "@polar-sh/better-auth";
import { Polar } from "@polar-sh/sdk";
import { handleSubscriptionWebhook } from "@/server/polar";
import { SUBSCRIPTION_PLANS } from "./utils";
import { createFreeSubscription } from "@/server/subscription";
import { sendEmail } from "./resend";
import OrganizationInvitationEmail from "@/components/emails/organization-invitation-email";
import MagicLinkEmail from "@/components/emails/magic-link-email";

const polarClient = new Polar({
	accessToken: process.env.POLAR_ACCESS_TOKEN!,
	// Use 'sandbox' for development, 'production' for live
	server: "sandbox",
});

export const auth = betterAuth({
	appName: "Multi-tenant SaaS Boilerplate",
	baseURL: process.env.NEXT_PUBLIC_APP_URL,
	session: {
		cookieCache: {
			enabled: true,
			maxAge: 5 * 60, // Cache duration in seconds
		},
	},
	emailAndPassword: {
		enabled: false,
		requireEmailVerification: false,
	},
	socialProviders: {
		google: {
			clientId: process.env.GOOGLE_CLIENT_ID as string,
			clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
		},
	},
	database: prismaAdapter(prisma, {
		provider: "postgresql", // or "mysql", "postgresql", ...etc
	}),
	onAPIError: {
		throw: true,
		onError: (error) => {
			// Custom error handling
			console.error("Auth error:", error);
		},
		errorURL: "/auth/error",
	},
	databaseHooks: {
		user: {
			create: {
				after: async (user) => {
					// Create a personal organization for the user
					const { data, success } = await createOrganization(
						user.id,
						{
							name: user.email.split("@")[0],
							slug: user.email.split("@")[0].toLowerCase(),
						}
					);

					if (success && data) {
						await createFreeSubscription(data.id);
					}
				},
			},
		},
		session: {
			create: {
				before: async (session) => {
					const organization = await getActiveOrganization(
						session.userId
					);
					return {
						data: {
							...session,
							activeOrganizationId: organization?.id,
							subscription: organization?.subscription,
						},
					};
				},
			},
		},
	},
	plugins: [
		organization({
			creatorRole: "admin",
			async sendInvitationEmail(data) {
				const { success, error } = await sendEmail({
					to: data.email,
					subject: `Invitation to join ${data.organization.name} on Noteapp`,
					react: OrganizationInvitationEmail({
						organizationName: data.organization.name,
						inviterName: data.inviter.user.name || "Someone",
						inviteeEmail: data.email,
						invitationId: data.id,
						role: data.role,
					}),
				});

				if (!success) {
					console.error("Error sending invitation email:", error);
				}
			},
			roles: {
				admin,
				member,
			},
		}),
		nextCookies(),
		customSession(async ({ user, session }) => {
			const organization = await getActiveOrganization(session.userId);
			return {
				user: {
					...user,
					role: organization?.role,
				},
				session,
				activeOrganizationId: organization?.id,
				subscription: organization?.subscription,
			};
		}),
		polar({
			client: polarClient,
			createCustomerOnSignUp: true,
			use: [
				checkout({
					products: SUBSCRIPTION_PLANS.map((plan) => ({
						productId: plan.productId,
						slug: plan.id,
					})),
					successUrl:
						"/dashboard/settings?tab=subscription&checkout_id={CHECKOUT_ID}",
					authenticatedUsersOnly: true,
				}),
				portal(),
				webhooks({
					secret: process.env.POLAR_WEBHOOK_SECRET!,
					onPayload: async (payload) => {
						console.log("Received Polar webhook:", payload);
						await handleSubscriptionWebhook(payload);
					},
				}),
			],
		}),
		magicLink({
			expiresIn: 60 * 5, // 5 minutes
			sendMagicLink: async ({ email, url }) => {
				await sendEmail({
					to: email,
					subject: "Your Magic Link is Here!",
					react: MagicLinkEmail({ email, magicLink: url }),
				});
			},
		}),
	],
});

export type User = typeof auth.$Infer.Session.user;
export type Session = typeof auth.$Infer.Session;
