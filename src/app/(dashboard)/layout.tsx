import { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
    title: "Dashboard | AI Chatbot",
    description: "Your AI Chatbot Dashboard",
};

/**
 * Dashboard Layout
 * Protected layout for authenticated users
 */
export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect("/login");
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            {children}
        </div>
    );
}
