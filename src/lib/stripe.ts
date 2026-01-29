import Stripe from "stripe";

/**
 * Stripe Client Configuration
 */

const stripeKey = process.env.STRIPE_SECRET_KEY || "dummy-key-for-build";

export const stripe = new Stripe(stripeKey, {
    apiVersion: "2026-01-28.clover",
    typescript: true,
});

/**
 * Get or create a Stripe customer for a user
 */
export async function getOrCreateCustomer(
    userId: string,
    email: string
): Promise<string> {
    // Check if we already have a customer ID stored
    // This would typically come from your database

    // Search for existing customer by email
    const existingCustomers = await stripe.customers.list({
        email,
        limit: 1,
    });

    if (existingCustomers.data.length > 0) {
        return existingCustomers.data[0].id;
    }

    // Create new customer
    const customer = await stripe.customers.create({
        email,
        metadata: {
            userId,
        },
    });

    return customer.id;
}

/**
 * Create a checkout session for subscription
 */
export async function createCheckoutSession(
    customerId: string,
    priceId: string,
    successUrl: string,
    cancelUrl: string
): Promise<Stripe.Checkout.Session> {
    return stripe.checkout.sessions.create({
        customer: customerId,
        payment_method_types: ["card"],
        line_items: [
            {
                price: priceId,
                quantity: 1,
            },
        ],
        mode: "subscription",
        success_url: successUrl,
        cancel_url: cancelUrl,
        allow_promotion_codes: true,
    });
}

/**
 * Create a billing portal session
 */
export async function createBillingPortalSession(
    customerId: string,
    returnUrl: string
): Promise<Stripe.BillingPortal.Session> {
    return stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: returnUrl,
    });
}

/**
 * Get subscription status
 */
export async function getSubscription(
    subscriptionId: string
): Promise<Stripe.Subscription | null> {
    try {
        return await stripe.subscriptions.retrieve(subscriptionId);
    } catch {
        return null;
    }
}

/**
 * Cancel subscription
 */
export async function cancelSubscription(
    subscriptionId: string
): Promise<Stripe.Subscription> {
    return stripe.subscriptions.update(subscriptionId, {
        cancel_at_period_end: true,
    });
}
