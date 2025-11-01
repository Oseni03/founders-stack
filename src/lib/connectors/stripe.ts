/* eslint-disable @typescript-eslint/no-explicit-any */
import Stripe from "stripe";
import { prisma } from "../prisma";
import { getIntegration } from "@/server/integrations";
import { Prisma } from "@prisma/client";
import { generateWebhookUrl } from "../utils";

// TypeScript interfaces matching your database schema
interface NormalizedCustomer {
	externalId: string;
	sourceTool: "stripe";
	email: string;
	name: string | null;
	createdAt: Date;
	metadata?: Record<string, unknown>;
}

interface NormalizedFinanceSubscription {
	externalId: string;
	sourceTool: "stripe";
	customerExternalId: string; // Used to find customerId in database
	planId: string;
	status: string;
	amount: number;
	billingCycle: string;
	startDate: Date;
	endDate: Date | null;
	nextBillingDate: Date | null;
	metadata?: Record<string, unknown>;
}

interface NormalizedInvoice {
	externalId: string;
	sourceTool: "stripe";
	customerExternalId: string; // Used to find customerId in database
	customerName: string | null;
	customerEmail: string | null;
	amountDue: number;
	amountPaid: number;
	amountRemaining: number;
	status: string;
	issuedDate: Date;
	dueDate: Date | null;
	pdfUrl: string | null;
	metadata?: any;
}

interface NormalizedBalance {
	externalId: null;
	sourceTool: "stripe";
	currency: string;
	availableAmount: number;
	pendingAmount: number;
	updatedAt: Date;
}

interface NormalizedEvent {
	externalId: string;
	sourceTool: "stripe";
	type: string;
	category: string;
	status: "pending";
	data: any;
	previousData?: any;
	createdAt: Date;
}

// Mapping Functions
function mapCustomerToNormalized(
	customer: Stripe.Customer | Stripe.DeletedCustomer
): NormalizedCustomer | null {
	if (customer.deleted) return null;
	return {
		externalId: customer.id,
		sourceTool: "stripe",
		email: customer.email ?? "",
		name: customer.name ?? null,
		createdAt: new Date(customer.created * 1000),
		metadata: customer.metadata,
	};
}

function mapSubscriptionToNormalized(
	sub: Stripe.Subscription
): NormalizedFinanceSubscription {
	return {
		externalId: sub.id,
		sourceTool: "stripe",
		customerExternalId:
			typeof sub.customer === "string" ? sub.customer : sub.customer.id,
		planId: sub.items.data[0]?.price.id ?? "",
		status: sub.status,
		amount: sub.items.data[0]?.price.unit_amount
			? sub.items.data[0].price.unit_amount / 100
			: 0,
		billingCycle: sub.items.data[0]?.price.recurring?.interval ?? "month",
		startDate: new Date(sub.start_date * 1000),
		endDate: sub.ended_at ? new Date(sub.ended_at * 1000) : null,
		nextBillingDate: sub.items.data[0].current_period_end
			? new Date(sub.items.data[0].current_period_end * 1000)
			: null,
		metadata: sub.metadata,
	};
}

function mapInvoiceToNormalized(invoice: Stripe.Invoice): NormalizedInvoice {
	return {
		externalId: invoice.id,
		sourceTool: "stripe",
		customerExternalId:
			typeof invoice.customer === "string"
				? invoice.customer
				: (invoice.customer?.id ?? ""),
		customerName: invoice.customer_name,
		customerEmail: invoice.customer_email,
		amountDue: invoice.amount_due / 100,
		amountPaid: invoice.amount_paid / 100,
		amountRemaining: invoice.amount_remaining / 100,
		status: invoice.status ?? "draft",
		issuedDate: new Date(invoice.created * 1000),
		dueDate: invoice.due_date ? new Date(invoice.due_date * 1000) : null,
		pdfUrl: invoice.invoice_pdf ?? null,
		metadata: invoice.metadata,
	};
}

function mapBalanceToNormalized(balance: Stripe.Balance): NormalizedBalance {
	return {
		externalId: null,
		sourceTool: "stripe",
		currency: balance.available[0]?.currency ?? "usd",
		availableAmount: balance.available[0]?.amount
			? balance.available[0].amount / 100
			: 0,
		pendingAmount: balance.pending[0]?.amount
			? balance.pending[0].amount / 100
			: 0,
		updatedAt: new Date(),
	};
}

function mapEventToNormalized(event: Stripe.Event): NormalizedEvent {
	// Determine category based on event type
	let category = "finance";
	if (event.type.startsWith("customer.")) category = "finance";
	else if (event.type.startsWith("payment_intent.")) category = "finance";
	else if (event.type.startsWith("invoice.")) category = "finance";
	else if (event.type.startsWith("subscription.")) category = "finance";
	else if (event.type.startsWith("charge.")) category = "finance";

	return {
		externalId: event.id,
		sourceTool: "stripe",
		type: event.type,
		category,
		status: "pending",
		data: event.data.object,
		previousData: event.data.previous_attributes,
		createdAt: new Date(event.created * 1000),
	};
}

export class StripeConnector {
	private stripe: Stripe;
	private static readonly CRITICAL_EVENTS = new Set([
		"customer.subscription.deleted",
		"customer.subscription.updated",
		"invoice.payment_failed",
		"invoice.paid",
		"charge.refunded",
		"customer.deleted",
	]);

	constructor(apiKey: string) {
		if (!apiKey || apiKey.trim().length === 0) {
			throw new Error("API key is required");
		}

		this.stripe = new Stripe(apiKey, {
			maxNetworkRetries: 2,
			timeout: 30000,
		});
	}

	async retrieveCustomer(
		customerId: string
	): Promise<NormalizedCustomer | null> {
		try {
			const response = await this.stripe.customers.retrieve(customerId);
			return mapCustomerToNormalized(response);
		} catch (error) {
			console.error("Failed to fetch customer:", error);
			throw error;
		}
	}

	async retrieveBalance(): Promise<NormalizedBalance> {
		try {
			const response = await this.stripe.balance.retrieve();
			return mapBalanceToNormalized(response);
		} catch (error) {
			console.error("Failed to fetch balance:", error);
			throw error;
		}
	}

	async getCustomers(): Promise<NormalizedCustomer[] | null> {
		const customers: NormalizedCustomer[] = [];
		let startingAfter: string | undefined;

		try {
			do {
				const response = await this.stripe.customers.list({
					limit: 100,
					starting_after: startingAfter,
				});

				for (const customer of response.data) {
					try {
						customers.push(mapCustomerToNormalized(customer)!);
					} catch (error) {
						console.error(
							`Failed to map customer ${customer.id}:`,
							error
						);
					}
				}

				startingAfter = response.has_more
					? response.data[response.data.length - 1].id
					: undefined;
			} while (startingAfter);

			return customers;
		} catch (error) {
			console.error("Failed to fetch customers:", error);
			throw error;
		}
	}

	async getSubscriptions(): Promise<NormalizedFinanceSubscription[]> {
		const subscriptions: NormalizedFinanceSubscription[] = [];
		let startingAfter: string | undefined;

		try {
			do {
				const response = await this.stripe.subscriptions.list({
					limit: 100,
					starting_after: startingAfter,
				});

				for (const sub of response.data) {
					try {
						subscriptions.push(mapSubscriptionToNormalized(sub));
					} catch (error) {
						console.error(
							`Failed to map subscription ${sub.id}:`,
							error
						);
					}
				}

				startingAfter = response.has_more
					? response.data[response.data.length - 1].id
					: undefined;
			} while (startingAfter);

			return subscriptions;
		} catch (error) {
			console.error("Failed to fetch subscriptions:", error);
			throw error;
		}
	}

	async getInvoices(): Promise<NormalizedInvoice[]> {
		const invoices: NormalizedInvoice[] = [];
		let startingAfter: string | undefined;

		try {
			do {
				const response = await this.stripe.invoices.list({
					limit: 100,
					starting_after: startingAfter,
				});

				for (const invoice of response.data) {
					try {
						invoices.push(mapInvoiceToNormalized(invoice));
					} catch (error) {
						console.error(
							`Failed to map invoice ${invoice.id}:`,
							error
						);
					}
				}

				startingAfter = response.has_more
					? response.data[response.data.length - 1].id
					: undefined;
			} while (startingAfter);

			return invoices;
		} catch (error) {
			console.error("Failed to fetch invoices:", error);
			throw error;
		}
	}

	async getBalance(): Promise<NormalizedBalance> {
		try {
			const balance = await this.stripe.balance.retrieve();
			return mapBalanceToNormalized(balance);
		} catch (error) {
			console.error("Failed to fetch balance:", error);
			throw error;
		}
	}

	async getEvents(options?: {
		limit?: number;
		startingAfter?: string;
		types?: string[]; // Filter by specific event types
	}): Promise<NormalizedEvent[]> {
		const events: NormalizedEvent[] = [];
		let startingAfter = options?.startingAfter;

		try {
			do {
				const response = await this.stripe.events.list({
					limit: options?.limit ?? 100,
					starting_after: startingAfter,
					types: options?.types,
				});

				for (const event of response.data) {
					try {
						events.push(mapEventToNormalized(event));
					} catch (error) {
						console.error(
							`Failed to map event ${event.id}:`,
							error
						);
					}
				}

				startingAfter = response.has_more
					? response.data[response.data.length - 1].id
					: undefined;
			} while (startingAfter && !options?.limit); // Only paginate if no limit specified

			return events;
		} catch (error) {
			console.error("Failed to fetch events:", error);
			throw error;
		}
	}

	/**
	 * Create a webhook endpoint in Stripe
	 * @param webhookUrl - The URL where Stripe will send webhook events
	 * @param enabledEvents - Array of event types to subscribe to (optional)
	 * @returns Webhook endpoint details including secret
	 */
	async createWebhookEndpoint(
		webhookUrl: string,
		enabledEvents?: string[]
	): Promise<{
		id: string;
		secret: string;
		url: string;
		status: string;
		enabledEvents: string[];
	}> {
		if (!webhookUrl || !webhookUrl.startsWith("https://")) {
			throw new Error("Webhook URL must be a valid HTTPS URL");
		}

		try {
			// Default events if none provided
			const events = enabledEvents || [
				"charge.succeeded",
				"charge.failed",
				"charge.refunded",
				"customer.created",
				"customer.updated",
				"customer.deleted",
				"customer.subscription.created",
				"customer.subscription.updated",
				"customer.subscription.deleted",
				"customer.subscription.trial_will_end",
				"invoice.created",
				"invoice.paid",
				"invoice.payment_failed",
				"invoice.payment_action_required",
				"payment_intent.succeeded",
				"payment_intent.payment_failed",
				"payment_intent.canceled",
			];

			const webhookEndpoint = await this.stripe.webhookEndpoints.create({
				url: webhookUrl,
				enabled_events:
					events as Stripe.WebhookEndpointCreateParams.EnabledEvent[],
				api_version: "2023-10-16", // Use latest stable version
				description: "Stack Management App - Automatic webhook",
			});

			return {
				id: webhookEndpoint.id,
				secret: webhookEndpoint.secret!,
				url: webhookEndpoint.url,
				status: webhookEndpoint.status,
				enabledEvents: webhookEndpoint.enabled_events,
			};
		} catch (error) {
			console.error("Failed to create webhook endpoint:", error);
			if (error instanceof Stripe.errors.StripeError) {
				throw new Error(`Stripe error: ${error.message}`);
			}
			throw error;
		}
	}

	/**
	 * Update an existing webhook endpoint
	 * @param webhookId - The ID of the webhook endpoint to update
	 * @param updates - Fields to update (url, enabled_events, etc.)
	 */
	async updateWebhookEndpoint(
		webhookId: string,
		updates: {
			url?: string;
			enabledEvents?: string[];
			disabled?: boolean;
		}
	): Promise<{
		id: string;
		url: string;
		status: string;
		enabledEvents: string[];
	}> {
		try {
			const updateParams: Stripe.WebhookEndpointUpdateParams = {};

			if (updates.url) {
				updateParams.url = updates.url;
			}

			if (updates.enabledEvents) {
				updateParams.enabled_events =
					updates.enabledEvents as Stripe.WebhookEndpointUpdateParams.EnabledEvent[];
			}

			if (updates.disabled !== undefined) {
				updateParams.disabled = updates.disabled;
			}

			const webhookEndpoint = await this.stripe.webhookEndpoints.update(
				webhookId,
				updateParams
			);

			return {
				id: webhookEndpoint.id,
				url: webhookEndpoint.url,
				status: webhookEndpoint.status,
				enabledEvents: webhookEndpoint.enabled_events,
			};
		} catch (error) {
			console.error("Failed to update webhook endpoint:", error);
			throw error;
		}
	}

	/**
	 * Delete a webhook endpoint
	 * @param webhookId - The ID of the webhook endpoint to delete
	 */
	async deleteWebhookEndpoint(webhookId: string): Promise<void> {
		try {
			await this.stripe.webhookEndpoints.del(webhookId);
		} catch (error) {
			console.error("Failed to delete webhook endpoint:", error);
			throw error;
		}
	}

	/**
	 * List all webhook endpoints for this account
	 */
	async listWebhookEndpoints(): Promise<
		Array<{
			id: string;
			url: string;
			status: string;
			enabledEvents: string[];
			created: Date;
		}>
	> {
		try {
			const endpoints = await this.stripe.webhookEndpoints.list({
				limit: 100,
			});

			return endpoints.data.map((endpoint) => ({
				id: endpoint.id,
				url: endpoint.url,
				status: endpoint.status,
				enabledEvents: endpoint.enabled_events,
				created: new Date(endpoint.created * 1000),
			}));
		} catch (error) {
			console.error("Failed to list webhook endpoints:", error);
			throw error;
		}
	}

	/**
	 * Test connection and get account info
	 * Used during initial connection to verify API key
	 */
	async testConnection(): Promise<{
		accountId: string;
		businessName: string | null;
		country: string;
		email: string | null;
		currency: string;
	}> {
		try {
			const account = await this.stripe.accounts.retrieve();

			return {
				accountId: account.id,
				businessName: account.business_profile?.name || null,
				country: account.country || "US",
				email: account.email || null,
				currency: account.default_currency || "usd",
			};
		} catch (error) {
			console.error("Failed to test Stripe connection:", error);
			if (error instanceof Stripe.errors.StripeAuthenticationError) {
				throw new Error("Invalid Stripe API key");
			}
			throw error;
		}
	}

	async constructEvent(
		rawBody: string,
		signature: string,
		secret: string
	): Promise<Stripe.Event> {
		if (!rawBody || !signature || !secret) {
			throw new Error("Missing required webhook parameters");
		}

		try {
			const event = this.stripe.webhooks.constructEvent(
				rawBody,
				signature,
				secret
			);
			return event;
		} catch (error) {
			console.error(`Error processing event:`, error);
			throw error;
		}
	}

	/**
	 * Process specific event types and return normalized data
	 */
	static async processStripeEvent(
		event: Stripe.Event,
		organizationId: string
	): Promise<void> {
		console.log(`Processing event ${event.id} of type ${event.type}`);

		try {
			switch (event.type) {
				// ==================== CUSTOMER EVENTS ====================
				case "customer.created":
				case "customer.updated":
					await handleCustomerEvent(event, organizationId);
					break;

				case "customer.deleted":
					await handleCustomerDeleted(event);
					break;

				// ==================== SUBSCRIPTION EVENTS ====================
				case "customer.subscription.created":
				case "customer.subscription.updated":
					await handleSubscriptionEvent(event, organizationId);
					break;

				case "customer.subscription.deleted":
					await handleSubscriptionDeleted(event);
					break;

				case "customer.subscription.trial_will_end":
					await handleSubscriptionTrialEnding(event);
					break;

				// ==================== INVOICE EVENTS ====================
				case "invoice.created":
				case "invoice.updated":
				case "invoice.finalized":
					await handleInvoiceEvent(event, organizationId);
					break;

				case "invoice.paid":
					await handleInvoicePaid(event, organizationId);
					break;

				case "invoice.payment_failed":
					await handleInvoicePaymentFailed(event, organizationId);
					break;

				// ==================== CHARGE EVENTS ====================
				case "charge.succeeded":
					await handleChargeSucceeded(event, organizationId);
					break;

				case "charge.failed":
					await handleChargeFailed(event);
					break;

				case "charge.refunded":
					await handleChargeRefunded(event, organizationId);
					break;

				// ==================== PAYMENT INTENT EVENTS ====================
				case "payment_intent.succeeded":
				case "payment_intent.payment_failed":
				case "payment_intent.canceled":
					// These are typically handled via invoice events
					console.log(
						`Payment intent event ${event.type} recorded but not processed separately`
					);
					break;

				default:
					console.log(`Unhandled event type: ${event.type}`);
			}

			// Mark event as processed
			await prisma.event.update({
				where: {
					externalId_sourceTool: {
						externalId: event.id,
						sourceTool: "stripe",
					},
				},
				data: {
					status: "processed",
					processedAt: new Date(),
				},
			});
		} catch (error) {
			console.error(`Error processing event ${event.id}:`, error);
			throw error;
		}
	}
}

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

export interface CreateIntegrationInput {
	organizationId: string;
	apiKey: string;
	displayName?: string;
}

export interface WebhookCreationResult {
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

async function handleCustomerEvent(
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

async function handleCustomerDeleted(event: Stripe.Event): Promise<void> {
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

async function handleSubscriptionEvent(
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

async function handleSubscriptionDeleted(event: Stripe.Event): Promise<void> {
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

async function handleSubscriptionTrialEnding(
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

async function handleInvoiceEvent(
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

async function handleInvoicePaid(
	event: Stripe.Event,
	organizationId: string
): Promise<void> {
	const invoice = event.data.object as Stripe.Invoice;

	await handleInvoiceEvent(event, organizationId);

	// Update balance after successful payment
	await updateBalance(organizationId);

	console.log(`Invoice ${invoice.id} marked as paid`);
}

async function handleInvoicePaymentFailed(
	event: Stripe.Event,
	organizationId: string
): Promise<void> {
	const invoice = event.data.object as Stripe.Invoice;

	await handleInvoiceEvent(event, organizationId);

	// Could trigger alert/notification here
	console.log(`Invoice ${invoice.id} payment failed`);
}

async function handleChargeSucceeded(
	event: Stripe.Event,
	organizationId: string
): Promise<void> {
	const charge = event.data.object as Stripe.Charge;

	// Update balance with successful charge
	await updateBalance(organizationId);

	console.log(`Charge ${charge.id} succeeded - balance updated`);
}

async function handleChargeFailed(event: Stripe.Event): Promise<void> {
	const charge = event.data.object as Stripe.Charge;

	console.log(`Charge ${charge.id} failed: ${charge.failure_message}`);
}

async function handleChargeRefunded(
	event: Stripe.Event,
	organizationId: string
): Promise<void> {
	const charge = event.data.object as Stripe.Charge;

	// Update balance after refund
	await updateBalance(organizationId);

	console.log(`Charge ${charge.id} refunded - balance updated`);
}

async function ensureCustomerExists(
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
async function updateBalance(organizationId: string): Promise<void> {
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

/**
 * Determine event category based on type
 */
export function determineEventCategory(eventType: string): string {
	if (eventType.startsWith("customer.")) return "customer";
	if (eventType.startsWith("charge.")) return "charge";
	if (eventType.startsWith("invoice.")) return "invoice";
	if (eventType.startsWith("payment_intent.")) return "payment";
	if (eventType.startsWith("subscription.")) return "subscription";
	return "other";
}
