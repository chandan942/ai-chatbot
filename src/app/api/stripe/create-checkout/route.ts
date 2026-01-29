import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createCheckoutSession, getOrCreateCustomer } from "@/lib/stripe";
import { checkoutSchema, validateRequest } from "@/lib/validation";

/**
 * Create Stripe Checkout Session
 */
export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { priceId } = validateRequest(checkoutSchema, body);

        // Get or create Stripe customer
        const customerId = await getOrCreateCustomer(user.id, user.email!);

        // Update profile with customer ID
        await supabase
            .from("profiles")
            .update({ stripe_customer_id: customerId })
            .eq("id", user.id);

        // Create checkout session
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
        const session = await createCheckoutSession(
            customerId,
            priceId,
            `${appUrl}/billing?success=true`,
            `${appUrl}/billing?canceled=true`
        );

        return NextResponse.json({ url: session.url });
    } catch (error) {
        const message = error instanceof Error ? error.message : "Checkout failed";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
