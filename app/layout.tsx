import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ variable: "--font-inter", subsets: ["latin", "latin-ext"] });

export const metadata: Metadata = {
  title: "Retreat Planner",
  description: "Vote on where the team goes for its next retreat.",
};

export const viewport: Viewport = { themeColor: "#faf9f6" };

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full font-sans">
        <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-4">{children}</div>
      </body>
    </html>
  );
}
