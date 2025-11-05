"use server";

import { StripeConnector } from "@/lib/connectors/stripe";
import { getIntegration } from "../integrations";
import { prisma } from "@/lib/prisma";
import { generateWebhookUrl } from "@/lib/utils";
import Stripe from "stripe";
import { Prisma } from "@prisma/client";
import {
	mapCustomerToNormalized,
	mapInvoiceToNormalized,
	mapSubscriptionToNormalized,
} from "@/lib/stripe-utils";
import { ConnectionHandlerResult } from "@/types/connector";

interface SyncResult {
	success: boolean;
	stats: {
		customers: number;
		subscriptions: number;
		invoices: number;
		balanceUpdated: boolean;
		events: number;
	};
	errors: string[];
}

export async function syncStripe(
	organizationId: string,
	apiKey?: string
): Promise<SyncResult> {
	const result: SyncResult = {
		success: false,
		stats: {
			customers: 0,
			subscriptions: 0,
			invoices: 0,
			balanceUpdated: false,
			events: 0,
		},
		errors: [],
	};

	const startTime = Date.now();
	console.log(
		`[${new Date().toISOString()}] Starting Stripe sync for organization ${organizationId}`
	);

	try {
		let connector;
		console.log(
			`[${new Date().toISOString()}] Initializing Stripe connector`
		);
		if (apiKey) {
			connector = new StripeConnector(apiKey);
			console.log(
				`[${new Date().toISOString()}] Using provided API key for Stripe connector`
			);
		} else {
			const integration = await getIntegration(organizationId, "stripe");
			if (!integration?.apiKey) {
				const errorMsg = "Stripe not integrated";
				console.error(`[${new Date().toISOString()}] ${errorMsg}`);
				throw new Error(errorMsg);
			}
			connector = new StripeConnector(integration.apiKey);
			console.log(
				`[${new Date().toISOString()}] Initialized connector with integration API key`
			);
		}

		console.log(
			`[${new Date().toISOString()}] Fetching Stripe data (customers, subscriptions, invoices, balance, events)`
		);
		const fetchStart = Date.now();
		const [customers, subscriptions, invoices, balance, events] =
			await Promise.all([
				connector.getCustomers(),
				connector.getSubscriptions(),
				connector.getInvoices(),
				connector.getBalance(),
				connector.getEvents({ limit: 100 }),
			]);
		const fetchDuration = Date.now() - fetchStart;
		console.log(
			`[${new Date().toISOString()}] Fetched Stripe data in ${fetchDuration}ms: ` +
				`Customers(${customers?.length || 0}), Subscriptions(${subscriptions?.length || 0}), ` +
				`Invoices(${invoices?.length || 0}), Events(${events?.length || 0})`
		);

		// 1. Saving Customers
		if (customers) {
			const customerStart = Date.now();
			console.log(
				`[${new Date().toISOString()}] Syncing ${customers.length} customers`
			);
			for (const customer of customers) {
				try {
					console.log(
						`[${new Date().toISOString()}] Upserting customer ${customer.externalId}`
					);
					await prisma.customer.upsert({
						where: {
							externalId_sourceTool: {
								externalId: customer.externalId,
								sourceTool: customer.sourceTool,
							},
						},
						update: {
							email: customer.email,
							name: customer.name,
						},
						create: {
							organizationId,
							externalId: customer.externalId,
							sourceTool: "stripe",
							email: customer.email,
							name: customer.name,
							createdAt: customer.createdAt,
						},
					});
					result.stats.customers++;
					console.log(
						`[${new Date().toISOString()}] Successfully upserted customer ${customer.externalId}`
					);
				} catch (error) {
					const errorMsg =
						error instanceof Error
							? error.message
							: "Unknown error";
					console.error(
						`[${new Date().toISOString()}] Failed to sync customer ${customer.externalId}: ${errorMsg}`
					);
					result.errors.push(
						`Customer ${customer.externalId}: ${errorMsg}`
					);
				}
			}
			const customerDuration = Date.now() - customerStart;
			console.log(
				`[${new Date().toISOString()}] Synced ${result.stats.customers}/${customers.length} customers in ${customerDuration}ms`
			);
		}

		// 2. Saving Subscriptions
		const subscriptionStart = Date.now();
		console.log(
			`[${new Date().toISOString()}] Syncing ${subscriptions?.length || 0} subscriptions`
		);
		try {
			for (const subscription of subscriptions) {
				try {
					console.log(
						`[${new Date().toISOString()}] Processing subscription ${subscription.externalId}`
					);
					const customer = await prisma.customer.findFirst({
						where: {
							externalId: subscription.customerExternalId,
							sourceTool: "stripe",
							organizationId,
						},
						select: { id: true },
					});

					if (!customer) {
						const errorMsg = `Subscription ${subscription.externalId}: Customer ${subscription.customerExternalId} not found`;
						console.warn(
							`[${new Date().toISOString()}] ${errorMsg}`
						);
						result.errors.push(errorMsg);
						continue;
					}

					await prisma.financeSubscription.upsert({
						where: {
							externalId_sourceTool: {
								externalId: subscription.externalId,
								sourceTool: subscription.sourceTool,
							},
						},
						update: {
							customerId: customer.id,
							planId: subscription.planId,
							status: subscription.status,
							amount: subscription.amount,
							billingCycle: subscription.billingCycle,
							startDate: subscription.startDate,
							endDate: subscription.endDate,
							nextBillingDate: subscription.nextBillingDate,
						},
						create: {
							organizationId,
							customerId: customer.id,
							externalId: subscription.externalId,
							sourceTool: subscription.sourceTool,
							planId: subscription.planId,
							status: subscription.status,
							amount: subscription.amount,
							billingCycle: subscription.billingCycle,
							startDate: subscription.startDate,
							endDate: subscription.endDate,
							nextBillingDate: subscription.nextBillingDate,
						},
					});
					result.stats.subscriptions++;
					console.log(
						`[${new Date().toISOString()}] Successfully upserted subscription ${subscription.externalId}`
					);
				} catch (error) {
					const errorMsg =
						error instanceof Error
							? error.message
							: "Unknown error";
					console.error(
						`[${new Date().toISOString()}] Failed to sync subscription ${subscription.externalId}: ${errorMsg}`
					);
					result.errors.push(
						`Subscription ${subscription.externalId}: ${errorMsg}`
					);
				}
			}
			const subscriptionDuration = Date.now() - subscriptionStart;
			console.log(
				`[${new Date().toISOString()}] Synced ${result.stats.subscriptions}/${subscriptions.length} subscriptions in ${subscriptionDuration}ms`
			);
		} catch (error) {
			const errorMsg =
				error instanceof Error ? error.message : "Unknown error";
			console.error(
				`[${new Date().toISOString()}] Subscriptions sync failed: ${errorMsg}`
			);
			result.errors.push(`Subscriptions sync failed: ${errorMsg}`);
		}

		// 3. Sync Invoices
		const invoiceStart = Date.now();
		console.log(
			`[${new Date().toISOString()}] Syncing ${invoices?.length || 0} invoices`
		);
		try {
			for (const invoice of invoices) {
				try {
					console.log(
						`[${new Date().toISOString()}] Processing invoice ${invoice.externalId}`
					);
					let customer = await prisma.customer.findFirst({
						where: {
							externalId: invoice.customerExternalId,
							sourceTool: "stripe",
							organizationId,
						},
						select: { id: true },
					});

					if (!customer) {
						if (!invoice.customerEmail) {
							console.warn(
								`[${new Date().toISOString()}] Skipping invoice ${invoice.externalId}: No customer email`
							);
							result.errors.push(
								`Invoice ${invoice.externalId}: Customer ${invoice.customerExternalId} not found`
							);
							continue;
						}
						console.log(
							`[${new Date().toISOString()}] Creating customer for invoice ${invoice.externalId}`
						);
						customer = await prisma.customer.upsert({
							where: {
								externalId_sourceTool: {
									externalId: invoice.customerExternalId,
									sourceTool: "stripe",
								},
							},
							create: {
								organizationId,
								name: invoice.customerName,
								email: invoice.customerEmail,
								sourceTool: "stripe",
								externalId: invoice.customerExternalId,
								createdAt: new Date(),
							},
							update: {
								email: invoice.customerEmail,
								name: invoice.customerName,
							},
							select: { id: true },
						});
						console.log(
							`[${new Date().toISOString()}] Created customer ${invoice.customerExternalId} for invoice`
						);
					}

					await prisma.invoice.upsert({
						where: {
							externalId_sourceTool: {
								externalId: invoice.externalId,
								sourceTool: invoice.sourceTool,
							},
						},
						update: {
							customerId: customer.id,
							amountDue: invoice.amountDue,
							amountPaid: invoice.amountPaid,
							amountRemaining: invoice.amountRemaining,
							status: invoice.status,
							issuedDate: invoice.issuedDate,
							dueDate: invoice.dueDate,
							pdfUrl: invoice.pdfUrl,
							metadata: invoice.metadata,
						},
						create: {
							organizationId,
							customerId: customer.id,
							externalId: invoice.externalId,
							sourceTool: invoice.sourceTool,
							amountDue: invoice.amountDue,
							amountPaid: invoice.amountPaid,
							amountRemaining: invoice.amountRemaining,
							status: invoice.status,
							issuedDate: invoice.issuedDate,
							dueDate: invoice.dueDate,
							pdfUrl: invoice.pdfUrl,
							metadata: invoice.metadata,
						},
					});
					result.stats.invoices++;
					console.log(
						`[${new Date().toISOString()}] Successfully upserted invoice ${invoice.externalId}`
					);
				} catch (error) {
					const errorMsg =
						error instanceof Error
							? error.message
							: "Unknown error";
					console.error(
						`[${new Date().toISOString()}] Failed to sync invoice ${invoice.externalId}: ${errorMsg}`
					);
					result.errors.push(
						`Invoice ${invoice.externalId}: ${errorMsg}`
					);
				}
			}
			const invoiceDuration = Date.now() - invoiceStart;
			console.log(
				`[${new Date().toISOString()}] Synced ${result.stats.invoices}/${invoices.length} invoices in ${invoiceDuration}ms`
			);
		} catch (error) {
			const errorMsg =
				error instanceof Error ? error.message : "Unknown error";
			console.error(
				`[${new Date().toISOString()}] Invoices sync failed: ${errorMsg}`
			);
			result.errors.push(`Invoices sync failed: ${errorMsg}`);
		}

		// 4. Sync Balance
		const balanceStart = Date.now();
		console.log(`[${new Date().toISOString()}] Syncing balance`);
		try {
			await prisma.balance.upsert({
				where: {
					organizationId_sourceTool: {
						organizationId,
						sourceTool: balance.sourceTool,
					},
				},
				update: {
					currency: balance.currency,
					availableAmount: balance.availableAmount,
					pendingAmount: balance.pendingAmount,
					updatedAt: balance.updatedAt,
				},
				create: {
					organizationId,
					externalId: balance.externalId,
					sourceTool: balance.sourceTool,
					currency: balance.currency,
					availableAmount: balance.availableAmount,
					pendingAmount: balance.pendingAmount,
					updatedAt: balance.updatedAt,
				},
			});
			result.stats.balanceUpdated = true;
			const balanceDuration = Date.now() - balanceStart;
			console.log(
				`[${new Date().toISOString()}] Balance synced successfully in ${balanceDuration}ms`
			);
		} catch (error) {
			const errorMsg =
				error instanceof Error ? error.message : "Unknown error";
			console.error(
				`[${new Date().toISOString()}] Balance sync failed: ${errorMsg}`
			);
			result.errors.push(`Balance sync failed: ${errorMsg}`);
		}

		// 5. Sync Recent Events
		const eventStart = Date.now();
		console.log(
			`[${new Date().toISOString()}] Syncing ${events?.length || 0} events`
		);
		try {
			for (const event of events) {
				try {
					console.log(
						`[${new Date().toISOString()}] Processing event ${event.externalId}`
					);
					await prisma.event.upsert({
						where: {
							externalId_sourceTool: {
								externalId: event.externalId,
								sourceTool: event.sourceTool,
							},
						},
						update: {
							status: event.status,
						},
						create: {
							organizationId,
							...event,
						},
					});
					result.stats.events++;
					console.log(
						`[${new Date().toISOString()}] Successfully upserted event ${event.externalId}`
					);
				} catch (error) {
					const errorMsg =
						error instanceof Error
							? error.message
							: "Unknown error";
					console.error(
						`[${new Date().toISOString()}] Failed to sync event ${event.externalId}: ${errorMsg}`
					);
					result.errors.push(
						`Event ${event.externalId}: ${errorMsg}`
					);
				}
			}
			const eventDuration = Date.now() - eventStart;
			console.log(
				`[${new Date().toISOString()}] Synced ${result.stats.events}/${events.length} events in ${eventDuration}ms`
			);
		} catch (error) {
			const errorMsg =
				error instanceof Error ? error.message : "Unknown error";
			console.error(
				`[${new Date().toISOString()}] Events sync failed: ${errorMsg}`
			);
			result.errors.push(`Events sync failed: ${errorMsg}`);
		}

		result.success = result.errors.length === 0;
		const totalDuration = Date.now() - startTime;
		console.log(
			`[${new Date().toISOString()}] Stripe sync completed in ${totalDuration}ms: ` +
				`Success=${result.success}, Stats=${JSON.stringify(result.stats)}, Errors=${result.errors.length}`
		);

		return result;
	} catch (error) {
		const errorMsg =
			error instanceof Error ? error.message : "Unknown error";
		console.error(
			`[${new Date().toISOString()}] Fatal Stripe sync error: ${errorMsg}`
		);
		result.errors.push(`Fatal error: ${errorMsg}`);
		return result;
	}
}

interface CreateIntegrationInput {
	organizationId: string;
	apiKey: string;
	displayName?: string;
}

/**
 * Main server action to connect Stripe integration and create webhook
 */
export async function connectStripeIntegration(
	input: CreateIntegrationInput
): Promise<ConnectionHandlerResult> {
	const { organizationId, apiKey, displayName } = input;
	const startTime = Date.now();
	console.log(
		`[${new Date().toISOString()}] Starting Stripe integration for organization ${organizationId}`
	);

	// Validate inputs
	console.log(`[${new Date().toISOString()}] Validating input parameters`);
	if (!organizationId || !apiKey) {
		const errorMsg = "Missing required fields: organizationId or apiKey";
		console.error(`[${new Date().toISOString()}] ${errorMsg}`);
		throw new Error(errorMsg);
	}

	if (!apiKey.startsWith("sk_test_") && !apiKey.startsWith("sk_live_")) {
		const errorMsg =
			"Invalid Stripe API key format. Must start with sk_test_ or sk_live_";
		console.error(`[${new Date().toISOString()}] ${errorMsg}`);
		throw new Error(errorMsg);
	}

	try {
		// Step 1: Initialize Stripe connector
		console.log(
			`[${new Date().toISOString()}] Initializing Stripe connector`
		);
		const stripeConnector = new StripeConnector(apiKey);

		// Step 2: Test connection and get account info
		console.log(`[${new Date().toISOString()}] Testing Stripe connection`);
		const accountInfoStart = Date.now();
		const accountInfo = await stripeConnector.testConnection();
		const accountInfoDuration = Date.now() - accountInfoStart;
		console.log(
			`[${new Date().toISOString()}] Stripe connection tested successfully in ${accountInfoDuration}ms: ` +
				`Account=${accountInfo.accountId}, Business=${accountInfo.businessName || accountInfo.email}`
		);

		// Step 3: Generate webhook URL
		console.log(`[${new Date().toISOString()}] Generating webhook URL`);
		const webhookUrl = generateWebhookUrl(organizationId, "stripe");
		console.log(
			`[${new Date().toISOString()}] Generated webhook URL: ${webhookUrl}`
		);

		// Step 4: Create webhook endpoint in Stripe
		console.log(
			`[${new Date().toISOString()}] Creating Stripe webhook endpoint`
		);
		const webhookStart = Date.now();
		const webhookData =
			await stripeConnector.createWebhookEndpoint(webhookUrl);
		const webhookDuration = Date.now() - webhookStart;
		console.log(
			`[${new Date().toISOString()}] Stripe webhook created successfully in ${webhookDuration}ms: ` +
				`WebhookID=${webhookData.id}, URL=${webhookData.url}, Events=${webhookData.enabledEvents.join(", ")}`
		);

		// Step 5: Save integration to database
		console.log(
			`[${new Date().toISOString()}] Saving integration to database`
		);
		const dbStart = Date.now();
		const integration = await prisma.integration.upsert({
			where: {
				organizationId_toolName: { organizationId, toolName: "stripe" },
			},
			update: {
				category: "PAYMENT",
				displayName:
					displayName ||
					`Stripe (${accountInfo.businessName || accountInfo.email || "Account"})`,
				status: "CONNECTED",
				apiKey,
				webhookSecret: webhookData.secret,
				webhookUrl: webhookData.url,
				webhookId: webhookData.id,
				webhookEvents: webhookData.enabledEvents,
				webhookSetupType: "AUTOMATIC",
				metadata: {
					accountId: accountInfo.accountId,
					businessName: accountInfo.businessName,
					country: accountInfo.country,
					email: accountInfo.email,
					currency: accountInfo.currency,
					webhookStatus: webhookData.status,
				},
				lastSyncAt: new Date(),
			},
			create: {
				organizationId,
				toolName: "stripe",
				category: "PAYMENT",
				displayName:
					displayName ||
					`Stripe (${accountInfo.businessName || accountInfo.email || "Account"})`,
				status: "CONNECTED",
				apiKey,
				webhookSecret: webhookData.secret,
				webhookUrl: webhookData.url,
				webhookId: webhookData.id,
				webhookEvents: webhookData.enabledEvents,
				webhookSetupType: "AUTOMATIC",
				metadata: {
					accountId: accountInfo.accountId,
					businessName: accountInfo.businessName,
					country: accountInfo.country,
					email: accountInfo.email,
					currency: accountInfo.currency,
					webhookStatus: webhookData.status,
				},
				lastSyncAt: new Date(),
			},
		});
		const dbDuration = Date.now() - dbStart;
		console.log(
			`[${new Date().toISOString()}] Integration saved successfully in ${dbDuration}ms: IntegrationID=${integration.id}`
		);

		// Step 6: Start initial data sync (async)
		console.log(
			`[${new Date().toISOString()}] Initiating background data sync for integration ${integration.id}`
		);
		startInitialSync(integration.id, apiKey).catch((error) => {
			const errorMsg =
				error instanceof Error ? error.message : "Unknown error";
			console.error(
				`[${new Date().toISOString()}] Initial sync failed for integration ${integration.id}: ${errorMsg}`
			);
			prisma.integration
				.update({
					where: { id: integration.id },
					data: { status: "ERROR" },
				})
				.then(() => {
					console.log(
						`[${new Date().toISOString()}] Updated integration ${integration.id} status to ERROR due to sync failure`
					);
				});
		});

		// Step 7: Return success response
		const totalDuration = Date.now() - startTime;
		console.log(
			`[${new Date().toISOString()}] Stripe integration completed in ${totalDuration}ms: ` +
				`IntegrationID=${integration.id}, WebhookID=${webhookData.id}`
		);
		return {
			integrationId: integration.id,
			status: "CONNECTED",
			message:
				"Stripe integration connected successfully. Syncing historical data...",
		};
	} catch (error) {
		const errorMsg =
			error instanceof Error
				? error.message
				: "Failed to connect Stripe integration";
		console.error(
			`[${new Date().toISOString()}] Failed to connect Stripe integration: ${errorMsg}`
		);
		throw new Error(errorMsg);
	}
}

/**
 * Background job to perform initial data sync
 * This runs asynchronously after integration is created
 */
async function startInitialSync(
	integrationId: string,
	apiKey: string
): Promise<void> {
	const startTime = Date.now();
	console.log(
		`[${new Date().toISOString()}] Starting initial sync for integration ${integrationId}`
	);

	try {
		const integration = await prisma.integration.findUnique({
			where: { id: integrationId },
		});

		if (!integration) {
			const errorMsg = "Integration not found";
			console.error(
				`[${new Date().toISOString()}] ${errorMsg} for integration ${integrationId}`
			);
			throw new Error(errorMsg);
		}

		console.log(
			`[${new Date().toISOString()}] Updating integration ${integrationId} status to SYNCING`
		);
		await prisma.integration.update({
			where: { id: integrationId },
			data: { status: "SYNCING" },
		});

		console.log(
			`[${new Date().toISOString()}] Running Stripe sync for organization ${integration.organizationId}`
		);
		const syncResult = await syncStripe(integration.organizationId, apiKey);
		const syncDuration = Date.now() - startTime;
		console.log(
			`[${new Date().toISOString()}] Initial sync completed in ${syncDuration}ms: ` +
				`Success=${syncResult.success}, Stats=${JSON.stringify(syncResult.stats)}, Errors=${syncResult.errors.length}`
		);

		console.log(
			`[${new Date().toISOString()}] Updating integration ${integrationId} status to CONNECTED`
		);
		await prisma.integration.update({
			where: { id: integrationId },
			data: { status: "CONNECTED", lastSyncAt: new Date() },
		});
	} catch (error) {
		const errorMsg =
			error instanceof Error ? error.message : "Unknown error";
		console.error(
			`[${new Date().toISOString()}] Initial sync failed for integration ${integrationId}: ${errorMsg}`
		);
		await prisma.integration.update({
			where: { id: integrationId },
			data: { status: "ERROR" },
		});
		console.log(
			`[${new Date().toISOString()}] Updated integration ${integrationId} status to ERROR`
		);
		throw error;
	}
}

// ============================================================================
// EVENT PROCESSING LOGIC
// ============================================================================

// ============================================================================
// CUSTOMER EVENT HANDLERS
// ============================================================================

export async function handleCustomerEvent(
	event: Stripe.Event,
	organizationId: string
): Promise<void> {
	const startTime = Date.now();
	const eventId = event.id;
	console.log(
		`[${new Date().toISOString()}] Processing customer event ${eventId} for organization ${organizationId}`
	);

	const customer = mapCustomerToNormalized(
		event.data.object as Stripe.Customer
	);
	if (!customer) {
		console.warn(
			`[${new Date().toISOString()}] No customer data in event ${eventId}`
		);
		return;
	}

	try {
		console.log(
			`[${new Date().toISOString()}] Upserting customer ${customer.externalId}`
		);
		await prisma.customer.upsert({
			where: {
				externalId_sourceTool: {
					externalId: customer.externalId,
					sourceTool: "stripe",
				},
			},
			create: {
				organizationId,
				...customer,
				metadata: customer.metadata as Prisma.InputJsonValue,
			},
			update: {
				email: customer.email,
				name: customer.name,
				metadata: customer.metadata as Prisma.InputJsonValue,
			},
		});
		const duration = Date.now() - startTime;
		console.log(
			`[${new Date().toISOString()}] Customer ${customer.externalId} upserted successfully in ${duration}ms`
		);
	} catch (error) {
		const errorMsg =
			error instanceof Error ? error.message : "Unknown error";
		console.error(
			`[${new Date().toISOString()}] Failed to process customer event ${eventId} for customer ${customer.externalId}: ${errorMsg}`
		);
		throw error;
	}
}

export async function handleInvoiceEvent(
	event: Stripe.Event,
	organizationId: string
): Promise<void> {
	const startTime = Date.now();
	const eventId = event.id;
	console.log(
		`[${new Date().toISOString()}] Processing invoice event ${eventId} for organization ${organizationId}`
	);

	const invoice = mapInvoiceToNormalized(event.data.object as Stripe.Invoice);
	try {
		console.log(
			`[${new Date().toISOString()}] Ensuring customer exists for invoice ${invoice.externalId}`
		);
		const customer = await ensureCustomerExists(
			invoice.customerExternalId,
			organizationId
		);

		console.log(
			`[${new Date().toISOString()}] Upserting invoice ${invoice.externalId}`
		);
		await prisma.invoice.upsert({
			where: {
				externalId_sourceTool: {
					externalId: invoice.externalId,
					sourceTool: "stripe",
				},
			},
			create: {
				organizationId,
				...invoice,
				customerId: customer.id,
				metadata: invoice.metadata as Prisma.InputJsonValue,
			},
			update: {
				amountDue: invoice.amountDue,
				amountPaid: invoice.amountPaid,
				amountRemaining: invoice.amountRemaining,
				status: invoice.status || "draft",
				dueDate: invoice.dueDate,
				pdfUrl: invoice.pdfUrl,
				metadata: invoice.metadata as Prisma.InputJsonValue,
			},
		});
		const duration = Date.now() - startTime;
		console.log(
			`[${new Date().toISOString()}] Invoice ${invoice.externalId} upserted successfully in ${duration}ms`
		);
	} catch (error) {
		const errorMsg =
			error instanceof Error ? error.message : "Unknown error";
		console.error(
			`[${new Date().toISOString()}] Failed to process invoice event ${eventId} for invoice ${invoice.externalId}: ${errorMsg}`
		);
		throw error;
	}
}

export async function handleCustomerDeleted(
	event: Stripe.Event
): Promise<void> {
	const customer = mapCustomerToNormalized(
		event.data.object as Stripe.Customer
	);

	if (!customer) return;

	// Soft delete: update metadata to mark as deleted
	await prisma.customer.delete({
		where: {
			externalId_sourceTool: {
				externalId: customer.externalId,
				sourceTool: "stripe",
			},
		},
	});

	console.log(`Customer ${customer.externalId} marked as deleted`);
}

export async function handleSubscriptionEvent(
	event: Stripe.Event,
	organizationId: string
): Promise<void> {
	const subscription = mapSubscriptionToNormalized(
		event.data.object as Stripe.Subscription
	);

	// Get or create customer first
	const customer = await ensureCustomerExists(
		subscription.customerExternalId,
		organizationId
	);

	await prisma.financeSubscription.upsert({
		where: {
			externalId_sourceTool: {
				externalId: subscription.externalId,
				sourceTool: "stripe",
			},
		},
		create: {
			organizationId,
			externalId: subscription.externalId,
			sourceTool: "stripe",
			customerId: customer.id,
			planId: subscription.planId,
			status: subscription.status,
			amount: subscription.amount,
			billingCycle: subscription.billingCycle,
			startDate: subscription.startDate,
			endDate: subscription.endDate,
			nextBillingDate: subscription.nextBillingDate,
			metadata: subscription.metadata as Prisma.InputJsonValue,
		},
		update: {
			status: subscription.status,
			amount: subscription.amount,
			billingCycle: subscription.billingCycle,
			startDate: subscription.startDate,
			endDate: subscription.endDate,
			nextBillingDate: subscription.nextBillingDate,
			metadata: subscription.metadata as Prisma.InputJsonValue,
		},
	});

	console.log(
		`Subscription ${subscription.externalId} upserted successfully`
	);
}

export async function handleSubscriptionDeleted(
	event: Stripe.Event
): Promise<void> {
	const subscription = mapSubscriptionToNormalized(
		event.data.object as Stripe.Subscription
	);

	await prisma.financeSubscription.update({
		where: {
			externalId_sourceTool: {
				externalId: subscription.externalId,
				sourceTool: "stripe",
			},
		},
		data: {
			status: "canceled",
			endDate: subscription.endDate,
			metadata: subscription.metadata as Prisma.InputJsonValue,
		},
	});

	console.log(`Subscription ${subscription.externalId} marked as canceled`);
}

export async function handleSubscriptionTrialEnding(
	event: Stripe.Event
): Promise<void> {
	const subscription = mapSubscriptionToNormalized(
		event.data.object as Stripe.Subscription
	);

	// Update subscription metadata to flag trial ending
	await prisma.financeSubscription.update({
		where: {
			externalId_sourceTool: {
				externalId: subscription.externalId,
				sourceTool: "stripe",
			},
		},
		data: {
			metadata: subscription.metadata as Prisma.InputJsonValue,
		},
	});

	console.log(
		`Subscription ${subscription.externalId} trial ending notification recorded`
	);
}

export async function handleInvoicePaid(
	event: Stripe.Event,
	organizationId: string
): Promise<void> {
	const invoice = event.data.object as Stripe.Invoice;

	await handleInvoiceEvent(event, organizationId);

	// Update balance after successful payment
	await updateBalance(organizationId);

	console.log(`Invoice ${invoice.id} marked as paid`);
}

export async function handleInvoicePaymentFailed(
	event: Stripe.Event,
	organizationId: string
): Promise<void> {
	const invoice = event.data.object as Stripe.Invoice;

	await handleInvoiceEvent(event, organizationId);

	// Could trigger alert/notification here
	console.log(`Invoice ${invoice.id} payment failed`);
}

export async function handleChargeSucceeded(
	event: Stripe.Event,
	organizationId: string
): Promise<void> {
	const charge = event.data.object as Stripe.Charge;

	// Update balance with successful charge
	await updateBalance(organizationId);

	console.log(`Charge ${charge.id} succeeded - balance updated`);
}

export async function handleChargeFailed(event: Stripe.Event): Promise<void> {
	const charge = event.data.object as Stripe.Charge;

	console.log(`Charge ${charge.id} failed: ${charge.failure_message}`);
}

export async function handleChargeRefunded(
	event: Stripe.Event,
	organizationId: string
): Promise<void> {
	const charge = event.data.object as Stripe.Charge;

	// Update balance after refund
	await updateBalance(organizationId);

	console.log(`Charge ${charge.id} refunded - balance updated`);
}

export async function ensureCustomerExists(
	stripeCustomerId: string,
	organizationId: string
): Promise<{ id: string }> {
	// Try to find existing customer
	let customer = await prisma.customer.findUnique({
		where: {
			externalId_sourceTool: {
				externalId: stripeCustomerId,
				sourceTool: "stripe",
			},
		},
		select: { id: true },
	});

	if (!customer) {
		// Fetch customer from Stripe and create
		const integration = await prisma.integration.findFirst({
			where: {
				organizationId,
				toolName: "stripe",
				status: "CONNECTED",
			},
		});

		if (!integration) {
			throw new Error("Stripe integration not found");
		}

		const connector = new StripeConnector(integration.apiKey!);

		const stripeCustomer =
			await connector.retrieveCustomer(stripeCustomerId);

		if (!stripeCustomer) {
			throw new Error(`Customer ${stripeCustomerId} has been deleted`);
		}

		customer = await prisma.customer.create({
			data: {
				organizationId,
				externalId: stripeCustomer.externalId,
				sourceTool: "stripe",
				email: stripeCustomer.email,
				name: stripeCustomer.name,
				createdAt: stripeCustomer.createdAt,
			},
			select: { id: true },
		});

		console.log(`Created missing customer ${stripeCustomer.externalId}`);
	}

	return customer;
}

/**
 * Update balance from Stripe
 */
export async function updateBalance(organizationId: string): Promise<void> {
	try {
		const integration = await prisma.integration.findFirst({
			where: {
				organizationId,
				toolName: "stripe",
				status: "CONNECTED",
			},
		});

		if (!integration) {
			console.warn("No Stripe integration found for balance update");
			return;
		}

		const stripeConnector = new StripeConnector(integration.apiKey!);

		const balance = await stripeConnector.retrieveBalance();

		await prisma.balance.upsert({
			where: {
				organizationId_sourceTool: {
					organizationId,
					sourceTool: "stripe",
				},
			},
			create: {
				organizationId,
				externalId: null, // Stripe balance has no ID
				sourceTool: "stripe",
				currency: "USD",
				availableAmount: balance.availableAmount,
				pendingAmount: balance.pendingAmount,
				updatedAt: new Date(),
			},
			update: {
				availableAmount: balance.availableAmount,
				pendingAmount: balance.pendingAmount,
				updatedAt: new Date(),
			},
		});

		console.log("Balance updated successfully");
	} catch (error) {
		console.error("Failed to update balance:", error);
		// Don't throw - balance update is not critical
	}
}

export async function disconnectStripeIntegration(
	organizationId: string
): Promise<{ success: boolean; message: string }> {
	const startTime = Date.now();
	console.log(
		`[${new Date().toISOString()}] Starting Stripe disconnection for organization ${organizationId}`
	);

	try {
		console.log(
			`[${new Date().toISOString()}] Fetching Stripe integration`
		);
		const integration = await prisma.integration.findUnique({
			where: {
				organizationId_toolName: {
					organizationId,
					toolName: "stripe",
				},
			},
		});

		if (!integration || integration.toolName !== "stripe") {
			const errorMsg = "Stripe integration not found";
			console.error(`[${new Date().toISOString()}] ${errorMsg}`);
			throw new Error(errorMsg);
		}

		if (integration.webhookId) {
			console.log(
				`[${new Date().toISOString()}] Deleting webhook ${integration.webhookId}`
			);
			try {
				const connector = new StripeConnector(integration.apiKey!);
				await connector.deleteWebhookEndpoint(integration.webhookId);
				console.log(
					`[${new Date().toISOString()}] Webhook ${integration.webhookId} deleted successfully`
				);
			} catch (error) {
				const errorMsg =
					error instanceof Error ? error.message : "Unknown error";
				console.warn(
					`[${new Date().toISOString()}] Failed to delete webhook ${integration.webhookId}: ${errorMsg}`
				);
			}
		}

		console.log(
			`[${new Date().toISOString()}] Updating integration status to DISCONNECTED`
		);
		await prisma.integration.update({
			where: {
				organizationId_toolName: {
					organizationId,
					toolName: "stripe",
				},
			},
			data: {
				status: "DISCONNECTED",
				webhookId: null,
				webhookUrl: null,
			},
		});

		const duration = Date.now() - startTime;
		console.log(
			`[${new Date().toISOString()}] Stripe integration disconnected successfully in ${duration}ms`
		);
		return {
			success: true,
			message: "Stripe integration disconnected successfully",
		};
	} catch (error) {
		const errorMsg =
			error instanceof Error
				? error.message
				: "Failed to disconnect Stripe integration";
		console.error(
			`[${new Date().toISOString()}] Failed to disconnect Stripe: ${errorMsg}`
		);
		throw new Error(errorMsg);
	}
}
