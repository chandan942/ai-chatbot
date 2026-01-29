import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { stripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/server";
import { logger } from "@/lib/logger";
import Stripe from "stripe";

/**
 * Stripe Webhook Handler
 * Processes subscription events from Stripe
 */

const relevantEvents = new Set([
    "checkout.session.completed",
    "customer.subscription.updated",
    "customer.subscription.deleted",
    "invoice.payment_succeeded",
    "invoice.payment_failed",
]);

export async function POST(request: NextRequest) {
    const body = await request.text();
    const headersList = await headers();
    const signature = headersList.get("stripe-signature");

    if (!signature) {
        return NextResponse.json({ error: "No signature" }, { status: 400 });
    }

    let event: Stripe.Event;

    try {
        event = stripe.webhooks.constructEvent(
            body,
            signature,
            process.env.STRIPE_WEBHOOK_SECRET!
        );
    } catch (err: unknown) {
        const e = err instanceof Error ? err : new Error(String(err));
        logger.error("Webhook signature verification failed", e);
        return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    if (!relevantEvents.has(event.type)) {
        return NextResponse.json({ received: true });
    }

    const supabase = createAdminClient();

    try {
        switch (event.type) {
            case "checkout.session.completed": {
                const session = event.data.object as Stripe.Checkout.Session;

                if (session.mode === "subscription" && session.customer) {
                    if (!session.customer_email) {
                        logger.error("No customer_email provided in checkout.session.completed");
                        return NextResponse.json({ error: "Missing customer_email in session" }, { status: 400 });
                    }

                    const subscription = (await stripe.subscriptions.retrieve(
                        session.subscription as string
                    )) as unknown as Stripe.Subscription;

                    // Get price to determine tier
                    const priceId = subscription.items.data[0].price.id;
                    const tier = getTierFromPriceId(priceId);

                    const periodEnd = (subscription as { currentPeriodEnd?: number; current_period_end?: number }).currentPeriodEnd
                        ?? (subscription as { current_period_end?: number }).current_period_end ?? null;

                    // Update user profile
                    const res = await supabase
                        .from("profiles")
                        .update({
                            stripe_customer_id: session.customer as string,
                            stripe_subscription_id: subscription.id,
                            subscription_status: "active",
                            subscription_tier: tier,
                            subscription_end_date: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
                            updated_at: new Date().toISOString(),
                        })
                        .eq("email", session.customer_email);

                    if (res.error) {
                        logger.error("Failed to update profile on checkout.session.completed", res.error);
                        return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
                    }

                    logger.payment("subscription_created", session.customer as string);
                }
                break;
            }

            case "customer.subscription.updated": {
                const subscription = event.data.object as unknown as Stripe.Subscription;
                const customerId = subscription.customer as string;

                const priceId = subscription.items.data[0].price.id;
                const tier = getTierFromPriceId(priceId);

                const periodEnd = (subscription as { currentPeriodEnd?: number; current_period_end?: number }).currentPeriodEnd
                    ?? (subscription as { current_period_end?: number }).current_period_end ?? null;

                const statusMap = (s: string) => {
                    switch (s) {
                        case "active":
                            return "active" as const;
                        case "trialing":
                            return "trialing" as const;
                        case "past_due":
                        case "unpaid":
                            return "past_due" as const;
                        case "incomplete":
                        case "incomplete_expired":
                            return "incomplete" as const;
                        case "paused":
                            return "paused" as const;
                        case "canceled":
                            return "canceled" as const;
                        default:
                            // Log unexpected statuses for debugging and return a safe fallback
                            console.warn(`Unhandled Stripe subscription status: ${s}`);
                            logger.warn?.("Unhandled Stripe subscription status", { status: s });
                            return "canceled" as const;
                    }
                }; 

                const newStatus = statusMap(subscription.status);

                const res = await supabase
                    .from("profiles")
                    .update({
                        subscription_status: newStatus,
                        subscription_tier: tier,
                        subscription_end_date: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
                        updated_at: new Date().toISOString(),
                    })
                    .eq("stripe_customer_id", customerId);

                if (res.error) {
                    logger.error("Failed to update profile on customer.subscription.updated", res.error);
                    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
                }

                logger.payment("subscription_updated", customerId);
                break;
            }

            case "customer.subscription.deleted": {
                const subscription = event.data.object as Stripe.Subscription;
                const customerId = subscription.customer as string;

                await supabase
                    .from("profiles")
                    .update({
                        subscription_status: "canceled",
                        subscription_tier: "free",
                        stripe_subscription_id: null,
                        updated_at: new Date().toISOString(),
                    })
                    .eq("stripe_customer_id", customerId);

                logger.payment("subscription_canceled", customerId);
                break;
            }

            case "invoice.payment_failed": {
                const invoice = event.data.object as Stripe.Invoice;
                const customerId = invoice.customer as string;

                const res = await supabase
                    .from("profiles")
                    .update({
                        subscription_status: "past_due",
                        updated_at: new Date().toISOString(),
                    })
                    .eq("stripe_customer_id", customerId);

                if (res.error) {
                    logger.error("Failed to update profile on invoice.payment_failed", res.error);
                    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
                }

                logger.payment("payment_failed", customerId);
                break;
            }

            case "invoice.payment_succeeded": {
                // On successful invoice payments, only update profile if the subscription is active
                const invoice = event.data.object as Stripe.Invoice & { subscription?: string };
                const customerId = invoice.customer as string;

                // If the invoice references a subscription, fetch it to resolve true status
                if (invoice.subscription) {
                    const subscription = (await stripe.subscriptions.retrieve(invoice.subscription)) as Stripe.Subscription;
                    if (subscription.status !== "active") {
                        // No update necessary (e.g., still trialing or paused)
                        logger.info("Invoice payment succeeded but subscription status not active, skipping profile update", { subscriptionId: subscription.id, status: subscription.status });
                        logger.payment("invoice_payment_succeeded_skipped", customerId);
                        break;
                    }
                }

                const res = await supabase
                    .from("profiles")
                    .update({
                        subscription_status: "active",
                        updated_at: new Date().toISOString(),
                    })
                    .eq("stripe_customer_id", customerId);

                if (res.error) {
                    logger.error("Failed to update profile on invoice.payment_succeeded", res.error);
                    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
                }

                logger.payment("payment_succeeded", customerId);
                break;
            }
        }

        return NextResponse.json({ received: true });
    } catch (error) {
        logger.error("Webhook handler error", error);
        return NextResponse.json(
            { error: "Webhook handler failed" },
            { status: 500 }
        );
    }
}

function getTierFromPriceId(priceId: string): "free" | "pro" | "enterprise" {
    if (priceId === process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_PRO) {
        return "pro";
    }
    if (priceId === process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_ENTERPRISE) {
        return "enterprise";
    }
    return "free";
}
