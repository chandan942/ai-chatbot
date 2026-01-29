import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getUserUsage } from "@/lib/usage-tracker";

/**
 * Get current user's usage statistics
 */
export async function GET() {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const usage = await getUserUsage(user.id);

        return NextResponse.json(usage);
    } catch (error) {
        return NextResponse.json(
            { error: "Failed to fetch usage" },
            { status: 500 }
        );
    }
}
