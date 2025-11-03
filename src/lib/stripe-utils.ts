import Stripe from "stripe";
import {
	NormalizedBalance,
	NormalizedCustomer,
	NormalizedEvent,
	NormalizedFinanceSubscription,
	NormalizedInvoice,
} from "./connectors/stripe";

// Mapping Functions
export function mapCustomerToNormalized(
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

export function mapSubscriptionToNormalized(
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

export function mapInvoiceToNormalized(
	invoice: Stripe.Invoice
): NormalizedInvoice {
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

export function mapBalanceToNormalized(
	balance: Stripe.Balance
): NormalizedBalance {
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

export function mapEventToNormalized(event: Stripe.Event): NormalizedEvent {
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
