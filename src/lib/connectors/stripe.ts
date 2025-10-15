/* eslint-disable @typescript-eslint/no-explicit-any */
import Stripe from "stripe";
import { prisma } from "../prisma";

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

interface WebhookProcessedData {
	type: "customer" | "subscription" | "invoice" | "refund" | "other";
	action:
		| "create"
		| "update"
		| "delete"
		| "paid"
		| "failed"
		| "refund"
		| "info";
	data: any;
}

// Mapping Functions
function mapCustomerToNormalized(
	customer: Stripe.Customer
): NormalizedCustomer {
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

	async getCustomers(): Promise<NormalizedCustomer[]> {
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
						customers.push(mapCustomerToNormalized(customer));
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
	 * Handles Stripe webhook events
	 * @param rawBody - Raw request body as string
	 * @param signature - Stripe signature from headers
	 * @param secret - Webhook secret from Stripe dashboard
	 * @returns Parsed webhook event and normalized data for storage
	 */
	static async handleWebhook(
		rawBody: string,
		signature: string,
		secret: string
	): Promise<{
		event: Stripe.Event;
		shouldStore: boolean;
		normalizedEvent?: NormalizedEvent;
		processedData?: WebhookProcessedData;
	}> {
		if (!rawBody || !signature || !secret) {
			throw new Error("Missing required webhook parameters");
		}

		const stripe = new Stripe("");

		try {
			const event = stripe.webhooks.constructEvent(
				rawBody,
				signature,
				secret
			);

			// Check if this is a critical event that should be stored
			const shouldStore = StripeConnector.CRITICAL_EVENTS.has(event.type);

			// Prepare normalized event data for storage
			let normalizedEvent: NormalizedEvent | undefined;

			if (shouldStore) {
				normalizedEvent = mapEventToNormalized(event);
			}

			// Process event and prepare normalized data
			const processedData =
				await StripeConnector.processStripeEvent(event);

			return {
				event,
				shouldStore,
				normalizedEvent,
				processedData,
			};
		} catch (error) {
			console.error("Webhook verification failed:", error);
			throw new Error("Webhook signature invalid");
		}
	}

	/**
	 * Process specific event types and return normalized data
	 */
	private static async processStripeEvent(
		event: Stripe.Event
	): Promise<WebhookProcessedData> {
		switch (event.type) {
			case "customer.subscription.deleted": {
				const subscription = event.data.object as Stripe.Subscription;
				return {
					type: "subscription",
					action: "delete",
					data: {
						externalId: subscription.id,
						status: "canceled",
						endDate: subscription.ended_at
							? new Date(subscription.ended_at * 1000)
							: new Date(),
					},
				};
			}

			case "customer.subscription.updated": {
				const subscription = event.data.object as Stripe.Subscription;
				return {
					type: "subscription",
					action: "update",
					data: mapSubscriptionToNormalized(subscription),
				};
			}

			case "invoice.payment_failed":
			case "invoice.paid": {
				const invoice = event.data.object as Stripe.Invoice;
				return {
					type: "invoice",
					action: event.type === "invoice.paid" ? "paid" : "failed",
					data: mapInvoiceToNormalized(invoice),
				};
			}

			case "charge.refunded": {
				const charge = event.data.object as Stripe.Charge;
				return {
					type: "refund",
					action: "refund",
					data: {
						chargeId: charge.id,
						amountRefunded: charge.amount_refunded
							? charge.amount_refunded / 100
							: 0,
						refundedAt: new Date(charge.created * 1000),
					},
				};
			}

			case "customer.deleted": {
				const customer = event.data.object as Stripe.Customer;
				return {
					type: "customer",
					action: "delete",
					data: {
						externalId: customer.id,
						deletedAt: new Date(),
					},
				};
			}

			default:
				console.log(
					`Event ${event.type} processed but not stored (informational)`
				);
				return {
					type: "other",
					action: "info",
					data: event.data.object,
				};
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
	apiKey: string
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
		// Initialize Stripe connector
		const connector = new StripeConnector(apiKey);

		// 1. Sync Customers
		console.log("Syncing customers...");
		try {
			const customers = await connector.getCustomers();

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

		// 2. Sync Subscriptions
		console.log("Syncing subscriptions...");
		try {
			const subscriptions = await connector.getSubscriptions();

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
		console.log("Syncing invoices...");
		try {
			const invoices = await connector.getInvoices();

			for (const invoice of invoices) {
				try {
					// Find the customer ID
					const customer = await prisma.customer.findFirst({
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
		console.log("Syncing balance...");
		try {
			const balance = await connector.getBalance();

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
			const events = await connector.getEvents({ limit: 100 });

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
