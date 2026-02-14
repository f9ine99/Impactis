import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Impactis | Premium Fintech Platform",
  description: "Connect startups, investors, and consultants in a trusted ecosystem.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className={`${inter.className} antialiased text-gray-900`}>
        {children}
        <Toaster position="top-right" richColors />
      </body>
    </html>
  );
}
