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

					// 1. Authorization URL: Send user here
					authorizationUrl: "https://slack.com/oauth/v2/authorize",

					// 2. Token URL: Exchange code for token
					tokenUrl: "https://slack.com/api/oauth.v2.access",

					// authorizationUrlParams: {
					// 	// BOT SCOPES: Workspace-level permissions (access via bot token xoxb-)
					// 	scope: [
					// 		"calls:read", // Read workspace call information
					// 		"channels:history", // Read messages in public channels
					// 		"channels:read", // View basic public channel info
					// 		// "conversations.connect:read", // ❌ REMOVE: Slack Connect feature - rarely needed
					// 		"groups:read", // View basic private channel info
					// 		"im:read", // View basic direct message info
					// 		"mpim:read", // View basic group DM info
					// 		"metadata.message:read", // Read message metadata
					// 		"pins:read", // View pinned items
					// 		"team:read", // Read workspace info
					// 		"im:history", // Read DM message history
					// 		"mpim:history", // Read group DM history
					// 	].join(","),

					// 	// USER SCOPES: Individual user permissions (access via user token xoxp-)
					// 	// CRITICAL: These provide authed_user.id and authed_user.access_token
					// 	user_scope: [
					// 		"identify", // ✅ REQUIRED: Provides authed_user data
					// 		"users:read", // ✅ REQUIRED: Read user information
					// 		"users.profile:read", // ✅ REQUIRED: Read user profile details
					// 		"reminders:read", // Optional: Read user's personal reminders
					// 	].join(","),
					// },

					// 4. Custom User Info Getter
					// FIXED: Properly typed to match OAuth2Tokens interface
					getUserInfo: async (tokens: {
						tokenType?: string;
						accessToken?: string;
						refreshToken?: string;
						accessTokenExpiresAt?: Date;
						refreshTokenExpiresAt?: Date;
						scopes?: string[];
						idToken?: string;
						// Slack-specific fields from token response (add as custom properties)
						authed_user?: { id: string };
						[key: string]: any; // Allow additional Slack-specific fields
					}) => {
						// Extract Slack user ID from token response
						// Slack returns 'authed_user.id' in the oauth.v2.access response
						const userId = tokens.authed_user?.id;
						const accessToken = tokens.accessToken;

						if (!userId || !accessToken) {
							console.error(
								"Missing userId or accessToken in Slack token response:",
								tokens
							);
							return null;
						}

						try {
							const userResponse = await fetch(
								`https://slack.com/api/users.info?user=${userId}`,
								{
									method: "GET",
									headers: {
										Authorization: `Bearer ${accessToken}`,
										"Content-Type":
											"application/json; charset=utf-8",
									},
								}
							);

							if (!userResponse.ok) {
								console.error(
									"Slack users.info API error:",
									userResponse.status
								);
								return null;
							}

							const data = await userResponse.json();

							// Slack API returns { ok: true/false, user: {...} }
							if (!data.ok) {
								console.error(
									"Slack API returned error:",
									data.error
								);
								return null;
							}

							return data;
						} catch (error) {
							console.error(
								"Error fetching Slack user info:",
								error
							);
							return null;
						}
					},

					// 5. Data Mapping: Map Slack user data to your user model
					mapProfileToUser: (profile) => {
						// Handle null response from getUserInfo
						if (!profile || !profile.user) {
							throw new Error("Invalid profile data from Slack");
						}

						const user = profile.user;
						const userProfile = user.profile;

						// Throw error if essential data is missing
						if (!user.id) {
							throw new Error(
								"Missing user ID from Slack profile"
							);
						}

						return {
							id: user.id,
							email:
								userProfile?.email || `${user.id}@slack.local`,
							emailVerified: Boolean(
								user.is_email_confirmed || userProfile?.email
							),
							name:
								userProfile?.real_name ||
								userProfile?.display_name ||
								user.name ||
								"Slack User",
							image:
								userProfile?.image_512 ||
								userProfile?.image_192 ||
								null,
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
			],
		}),
	],
});

export type User = typeof auth.$Infer.Session.user;
export type Session = typeof auth.$Infer.Session;
