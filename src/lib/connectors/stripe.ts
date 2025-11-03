/* eslint-disable @typescript-eslint/no-explicit-any */
import Stripe from "stripe";
import { prisma } from "../prisma";
import {
	handleChargeFailed,
	handleChargeRefunded,
	handleChargeSucceeded,
	handleCustomerDeleted,
	handleCustomerEvent,
	handleInvoiceEvent,
	handleInvoicePaid,
	handleInvoicePaymentFailed,
	handleSubscriptionDeleted,
	handleSubscriptionEvent,
	handleSubscriptionTrialEnding,
} from "@/server/platforms/stripe";
import {
	mapBalanceToNormalized,
	mapCustomerToNormalized,
	mapEventToNormalized,
	mapInvoiceToNormalized,
	mapSubscriptionToNormalized,
} from "../stripe-utils";

// TypeScript interfaces matching your database schema
export interface NormalizedCustomer {
	externalId: string;
	sourceTool: "stripe";
	email: string;
	name: string | null;
	createdAt: Date;
	metadata?: Record<string, unknown>;
}

export interface NormalizedFinanceSubscription {
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

export interface NormalizedInvoice {
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

export interface NormalizedBalance {
	externalId: null;
	sourceTool: "stripe";
	currency: string;
	availableAmount: number;
	pendingAmount: number;
	updatedAt: Date;
}

export interface NormalizedEvent {
	externalId: string;
	sourceTool: "stripe";
	type: string;
	category: string;
	status: "pending";
	data: any;
	previousData?: any;
	createdAt: Date;
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
