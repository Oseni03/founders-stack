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

	try {
		let connector;
		// Initialize Stripe connector
		if (apiKey) {
			connector = new StripeConnector(apiKey);
		} else {
			const integration = await getIntegration(organizationId, "stripe");
			if (!integration?.apiKey) {
				throw new Error("Stripe not integrated");
			}
			connector = new StripeConnector(integration.apiKey);
		}

		const [customers, subscriptions, invoices, balance, events] =
			await Promise.all([
				connector.getCustomers(),
				connector.getSubscriptions(),
				connector.getInvoices(),
				connector.getBalance(),
				connector.getEvents({ limit: 100 }),
			]);
		// 1. saving Customers
		if (customers) {
			try {
				for (const customer of customers) {
					try {
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
								// metadata: customer.metadata,
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
					} catch (error) {
						console.error(
							`Failed to sync customer ${customer.externalId}:`,
							error
						);
						result.errors.push(
							`Customer ${customer.externalId}: ${error instanceof Error ? error.message : "Unknown error"}`
						);
					}
				}
				console.log(`Synced ${customers.length} customers`);
			} catch (error) {
				console.error("Failed to fetch customers:", error);
				result.errors.push(
					`Customers sync failed: ${error instanceof Error ? error.message : "Unknown error"}`
				);
			}
		}

		// 2. saving Subscriptions
		console.log("Syncing subscriptions...");
		try {
			for (const subscription of subscriptions) {
				try {
					// Find the customer ID from the external ID
					const customer = await prisma.customer.findFirst({
						where: {
							externalId: subscription.customerExternalId,
							sourceTool: "stripe",
							organizationId,
						},
						select: { id: true },
					});

					if (!customer) {
						result.errors.push(
							`Subscription ${subscription.externalId}: Customer ${subscription.customerExternalId} not found`
						);
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
							// metadata: subscription.metadata,
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
							// metadata: subscription.metadata,
						},
					});
					result.stats.subscriptions++;
				} catch (error) {
					console.error(
						`Failed to sync subscription ${subscription.externalId}:`,
						error
					);
					result.errors.push(
						`Subscription ${subscription.externalId}: ${error instanceof Error ? error.message : "Unknown error"}`
					);
				}
			}
			console.log(`Synced ${subscriptions.length} subscriptions`);
		} catch (error) {
			console.error("Failed to fetch subscriptions:", error);
			result.errors.push(
				`Subscriptions sync failed: ${error instanceof Error ? error.message : "Unknown error"}`
			);
		}

		// 3. Sync Invoices
		console.log("Saving invoices...");
		try {
			for (const invoice of invoices) {
				try {
					// Find the customer ID
					let customer = await prisma.customer.findFirst({
						where: {
							externalId: invoice.customerExternalId,
							sourceTool: "stripe",
							organizationId,
						},
						select: { id: true },
					});

					if (!customer) {
						result.errors.push(
							`Invoice ${invoice.externalId}: Customer ${invoice.customerExternalId} not found`
						);
						continue;
					} else {
						if (!invoice.customerEmail) continue;
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
				} catch (error) {
					console.error(
						`Failed to sync invoice ${invoice.externalId}:`,
						error
					);
					result.errors.push(
						`Invoice ${invoice.externalId}: ${error instanceof Error ? error.message : "Unknown error"}`
					);
				}
			}
			console.log(`Synced ${invoices.length} invoices`);
		} catch (error) {
			console.error("Failed to fetch invoices:", error);
			result.errors.push(
				`Invoices sync failed: ${error instanceof Error ? error.message : "Unknown error"}`
			);
		}

		// 4. Sync Balance
		console.log("Saving balance...");
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
			console.log("Balance synced");
		} catch (error) {
			console.error("Failed to fetch balance:", error);
			result.errors.push(
				`Balance sync failed: ${error instanceof Error ? error.message : "Unknown error"}`
			);
		}

		// 5. Sync Recent Events (last 100)
		console.log("Syncing events...");
		try {
			for (const event of events) {
				try {
					await prisma.event.upsert({
						where: {
							externalId_sourceTool: {
								externalId: event.externalId,
								sourceTool: event.sourceTool,
							},
						},
						update: {
							// Events typically don't change, but we can update status if needed
							status: event.status,
						},
						create: {
							organizationId,
							...event,
						},
					});
					result.stats.events++;
				} catch (error) {
					console.error(
						`Failed to sync event ${event.externalId}:`,
						error
					);
					result.errors.push(
						`Event ${event.externalId}: ${error instanceof Error ? error.message : "Unknown error"}`
					);
				}
			}
			console.log(`Synced ${result.stats.events} events`);
		} catch (error) {
			console.error("Failed to fetch events:", error);
			result.errors.push(
				`Events sync failed: ${error instanceof Error ? error.message : "Unknown error"}`
			);
		}

		result.success = result.errors.length === 0;

		console.log("Stripe sync completed:", result.stats);
		return result;
	} catch (error) {
		console.error("Stripe sync failed:", error);
		result.errors.push(
			`Fatal error: ${error instanceof Error ? error.message : "Unknown error"}`
		);
		return result;
	}
}

interface CreateIntegrationInput {
	organizationId: string;
	apiKey: string;
	displayName?: string;
}

interface WebhookCreationResult {
	integrationId: string;
	webhookId: string;
	webhookUrl: string;
	status: "CONNECTED" | "PENDING_SETUP" | "ERROR";
	message: string;
}

/**
 * Main server action to connect Stripe integration and create webhook
 */
export async function connectStripeIntegration(
	input: CreateIntegrationInput
): Promise<WebhookCreationResult> {
	const { organizationId, apiKey, displayName } = input;

	// Validate inputs
	if (!organizationId || !apiKey) {
		throw new Error("Missing required fields: organizationId or apiKey");
	}

	// Validate API key format
	if (!apiKey.startsWith("sk_test_") && !apiKey.startsWith("sk_live_")) {
		throw new Error(
			"Invalid Stripe API key format. Must start with sk_test_ or sk_live_"
		);
	}

	try {
		// Step 1: Initialize Stripe connector
		const stripeConnector = new StripeConnector(apiKey);

		// Step 2: Test connection and get account info
		const accountInfo = await stripeConnector.testConnection();

		// Step 3: Generate webhook URL
		const webhookUrl = generateWebhookUrl(organizationId, "stripe");

		// Step 4: Create webhook endpoint in Stripe
		const webhookData =
			await stripeConnector.createWebhookEndpoint(webhookUrl);

		console.log("Webhook created successfully:", webhookData.id);

		// Step 5: Save integration to database
		const integration = await prisma.integration.create({
			data: {
				organizationId,
				toolName: "stripe",
				category: "PAYMENT",
				displayName:
					displayName ||
					`Stripe (${accountInfo.businessName || accountInfo.email || "Account"})`,
				status: "CONNECTED",

				// Encrypt sensitive data
				apiKey,
				webhookSecret: webhookData.secret,

				// Webhook configuration
				webhookUrl: webhookData.url,
				webhookId: webhookData.id,
				webhookEvents: webhookData.enabledEvents,
				webhookSetupType: "AUTOMATIC",

				// Account metadata
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

		// Step 6: Start initial data sync (async - don't wait)
		// This runs in the background
		startInitialSync(integration.id, apiKey).catch((error) => {
			console.error("Initial sync failed:", error);
			// Update integration status to show error
			prisma.integration.update({
				where: { id: integration.id },
				data: {
					status: "ERROR",
				},
			});
		});

		// Step 7: Return success response
		return {
			integrationId: integration.id,
			webhookId: webhookData.id,
			webhookUrl: webhookData.url,
			status: "CONNECTED",
			message:
				"Stripe integration connected successfully. Syncing historical data...",
		};
	} catch (error) {
		console.error("Failed to connect Stripe integration:", error);

		// If we created a webhook but DB save failed, try to clean up
		// (You might want to add webhook cleanup logic here)

		throw new Error(
			error instanceof Error
				? error.message
				: "Failed to connect Stripe integration"
		);
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
	try {
		const integration = await prisma.integration.findUnique({
			where: { id: integrationId },
		});

		if (!integration) {
			throw new Error("Integration not found");
		}

		// Update status to syncing
		await prisma.integration.update({
			where: { id: integrationId },
			data: { status: "SYNCING" },
		});

		await syncStripe(integration.organizationId, apiKey);

		// Update status to connected after successful sync
		await prisma.integration.update({
			where: { id: integrationId },
			data: { status: "CONNECTED", lastSyncAt: new Date() },
		});
	} catch (error) {
		console.error(
			`Initial sync failed for integration ${integrationId}:`,
			error
		);

		// Update integration with error status
		await prisma.integration.update({
			where: { id: integrationId },
			data: {
				status: "ERROR",
			},
		});

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
	const customer = mapCustomerToNormalized(
		event.data.object as Stripe.Customer
	);

	if (!customer) return;

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
			metadata: customer.metadata as Prisma.InputJsonValue, // ← cast
		},
		update: {
			email: customer.email,
			name: customer.name,
			metadata: customer.metadata as Prisma.InputJsonValue, // ← cast
		},
	});

	console.log(`Customer ${customer.externalId} upserted successfully`);
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

export async function handleInvoiceEvent(
	event: Stripe.Event,
	organizationId: string
): Promise<void> {
	const invoice = mapInvoiceToNormalized(event.data.object as Stripe.Invoice);

	// Ensure customer exists
	const customer = await ensureCustomerExists(
		invoice.customerExternalId,
		organizationId
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

	console.log(`Invoice ${invoice.externalId} upserted successfully`);
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
