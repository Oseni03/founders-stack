/* eslint-disable @typescript-eslint/no-explicit-any */
import { betterAuth } from "better-auth";
import { nextCookies } from "better-auth/next-js";
import {
	customSession,
	organization,
	magicLink,
	genericOAuth,
} from "better-auth/plugins";
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
import { createIntegration } from "@/server/integrations";

const polarClient = new Polar({
	accessToken: process.env.POLAR_ACCESS_TOKEN!,
	// Use 'sandbox' for development, 'production' for live
	server: "sandbox",
});

export const auth = betterAuth({
	appName: "Founders' Stack",
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
		account: {
			create: {
				after: async (account) => {
					await createIntegration(account);
				},
			},
		},
	},
	account: {
		accountLinking: {
			enabled: true,
			allowDifferentEmails: true,
			allowUnlinkingAll: true,
		},
	},
	plugins: [
		organization({
			creatorRole: "admin",
			async sendInvitationEmail(data) {
				const { success, error } = await sendEmail({
					to: data.email,
					subject: `Invitation to join ${data.organization.name} on Founders' Stack`,
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
		genericOAuth({
			config: [
				{
					providerId: "slack",
					clientId: process.env.SLACK_CLIENT_ID!,
					clientSecret: process.env.SLACK_CLIENT_SECRET!,
					authorizationUrl: "https://slack.com/oauth/v2/authorize",
					tokenUrl: "https://slack.com/api/oauth.v2.access",
					userInfoUrl:
						"https://slack.com/api/openid.connect.userInfo",
					scopes: [
						"openid",
						"email",
						"profile",
						"channels:history",
						"channels:read",
						"groups:read",
						"im:read",
						"mpim:read",
						"pins:read",
						"team:read",
						"im:history",
						"mpim:history",
					],
					getUserInfo: async (tokens) => {
						console.log("Slack tokens:", tokens);

						// With only user_scope, tokens.accessToken will be the user token
						const response = await fetch(
							"https://slack.com/api/openid.connect.userInfo",
							{
								headers: {
									Authorization: `Bearer ${tokens.accessToken}`,
								},
							}
						);

						const data = await response.json();
						console.log("Slack user info:", data);

						if (data.ok === false && data.error) {
							throw new Error(`Slack API error: ${data.error}`);
						}

						// ✅ Return in OAuth2UserInfo format
						return {
							id:
								data.sub ||
								data["https://slack.com/user_id"] ||
								"",
							name: data.name || "Unknown",
							email: data.email || null,
							image: data.picture || undefined,
							emailVerified: data.email_verified || false,
						};
					},
				},
				{
					providerId: "github",
					clientId: process.env.GITHUB_CLIENT_ID!,
					clientSecret: process.env.GITHUB_CLIENT_SECRET!,
					authorizationUrl:
						"https://github.com/login/oauth/authorize",
					tokenUrl: "https://github.com/login/oauth/access_token",
					userInfoUrl: "https://api.github.com/user",
					scopes: [
						"repo",
						"read:discussion",
						"project",
						"read:user",
						"user:email",
					],
					authorizationUrlParams: {
						scope: "repo read:discussion project read:user user:email",
					},
					redirectURI: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/oauth2/callback/github`,
					mapProfileToUser: async (profile) => {
						console.log("GitHub OAuth profile: ", profile);
						let email = profile.email;

						if (!email) {
							const emailsResponse = await fetch(
								"https://api.github.com/user/emails",
								{
									headers: {
										Authorization: `Bearer ${profile.access_token}`,
										Accept: "application/vnd.github.v3+json",
									},
								}
							);

							if (emailsResponse.ok) {
								const emails = await emailsResponse.json();
								const primaryEmail = emails.find(
									(e: any) => e.primary && e.verified
								);
								email = primaryEmail?.email || emails[0]?.email;
								console.log("Github email generated: ", email);
							}
						}

						return {
							id: profile.id.toString(),
							email: email || `${profile.login}@github.local`,
							emailVerified: !!profile.email,
							name: profile.name || profile.login,
							image: profile.avatar_url,
						};
					},
				},
				{
					providerId: "asana",
					clientId: process.env.ASANA_CLIENT_ID!,
					clientSecret: process.env.ASANA_CLIENT_SECRET!,
					authorizationUrl: "https://app.asana.com/-/oauth_authorize",
					tokenUrl: "https://app.asana.com/-/oauth_token",
					userInfoUrl:
						"https://app.asana.com/api/1.0/openid_connect/userinfo",
					scopes: [
						"tasks:read",
						"projects:read",
						"users:read",
						"openid",
						"email",
						"profile",
					],
					redirectURI: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/oauth2/callback/asana`,
				},
			],
		}),
	],
});

export type User = typeof auth.$Infer.Session.user;
export type Session = typeof auth.$Infer.Session;
