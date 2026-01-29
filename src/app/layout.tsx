import type { Metadata } from "next";
import ThemeProvider from "@/components/ThemeProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Chatbot | Your Intelligent Assistant",
  description: "A powerful AI chatbot with multi-model support including GPT-4, Claude 3, and Gemini Pro",
  keywords: ["AI", "chatbot", "GPT-4", "Claude", "Gemini", "AI assistant"],
  authors: [{ name: "AI Chatbot" }],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white font-sans">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
